import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { site_id, force } = await req.json();
    
    console.log('🚀 GSC Smart Scheduler - Starting', { site_id, force });

    // Buscar sites com URLs descobertas não agendadas
    const sitesQuery = site_id
      ? supabase.from('rank_rent_sites').select('id, site_url').eq('id', site_id)
      : supabase.from('rank_rent_sites').select('id, site_url');

    const { data: sites, error: sitesError } = await sitesQuery;

    if (sitesError) throw sitesError;

    let totalUrlsScheduled = 0;
    let totalCapacity = 0;
    let sitesProcessed = 0;
    let integrationsUsed = 0;

    for (const site of sites || []) {
      // Buscar integrações ativas e saudáveis do site
      const { data: integrations, error: intError } = await supabase
        .from('google_search_console_integrations')
        .select('id, connection_name')
        .eq('site_id', site.id)
        .eq('is_active', true)
        .eq('health_status', 'healthy');

      if (intError) {
        console.error(`❌ Erro ao buscar integrações do site ${site.id}:`, intError);
        continue;
      }

      if (!integrations || integrations.length === 0) {
        console.log(`⚠️ Site ${site.id} não tem integrações ativas/saudáveis`);
        continue;
      }

      integrationsUsed += integrations.length;
      const siteCapacity = integrations.length * 200; // 200 URLs/dia por integração
      totalCapacity += siteCapacity;

      // Buscar URLs descobertas não agendadas
      const { data: discoveredUrls, error: urlsError } = await supabase
        .from('gsc_discovered_urls')
        .select('id, url, priority')
        .eq('site_id', site.id)
        .eq('current_status', 'discovered')
        .is('scheduled_for', null)
        .eq('auto_schedule_enabled', true)
        .order('priority', { ascending: false })
        .order('discovered_at', { ascending: true });

      if (urlsError) {
        console.error(`❌ Erro ao buscar URLs do site ${site.id}:`, urlsError);
        continue;
      }

      if (!discoveredUrls || discoveredUrls.length === 0) {
        console.log(`⚠️ Site ${site.id} não tem URLs para agendar`);
        continue;
      }

      console.log(`📊 Site ${site.id}: ${discoveredUrls.length} URLs para distribuir em ${integrations.length} integrações`);

      // Distribuir URLs ao longo de 24h (48 slots de 30 min)
      const SLOTS_PER_DAY = 48;
      const urlsPerSlot = Math.ceil(discoveredUrls.length / SLOTS_PER_DAY);
      const now = new Date();
      const updates: Array<{ id: string; scheduled_for: string; integration_id: string }> = [];
      const submissionGroups: { [key: string]: string[] } = {};

      discoveredUrls.forEach((urlObj, index) => {
        // Calcular slot (0-47) e adicionar 30 min por slot
        const slotIndex = Math.floor(index / urlsPerSlot);
        const scheduledFor = new Date(now);
        scheduledFor.setMinutes(scheduledFor.getMinutes() + (slotIndex * 30));

        // Rotação entre integrações
        const integrationIndex = index % integrations.length;
        const integration = integrations[integrationIndex];

        updates.push({
          id: urlObj.id,
          scheduled_for: scheduledFor.toISOString(),
          integration_id: integration.id,
        });

        // Agrupar URLs por horário para gsc_scheduled_submissions
        const timeKey = scheduledFor.toISOString();
        if (!submissionGroups[timeKey]) {
          submissionGroups[timeKey] = [];
        }
        submissionGroups[timeKey].push(urlObj.url);
      });

      // Atualizar gsc_discovered_urls com scheduled_for
      for (const update of updates) {
        await supabase
          .from('gsc_discovered_urls')
          .update({
            scheduled_for: update.scheduled_for,
          })
          .eq('id', update.id);
      }

      // Criar registros em gsc_scheduled_submissions
      for (const [scheduledFor, urls] of Object.entries(submissionGroups)) {
        await supabase
          .from('gsc_scheduled_submissions')
          .insert({
            site_id: site.id,
            submission_type: 'auto_distribution',
            scheduled_for: scheduledFor,
            urls: urls,
            priority: 50,
            status: 'pending',
          });
      }

      totalUrlsScheduled += discoveredUrls.length;
      sitesProcessed++;

      console.log(`✅ Site ${site.id}: ${discoveredUrls.length} URLs agendadas em ${SLOTS_PER_DAY} slots`);
    }

    // Calcular próximo horário de processamento
    const nextSlot = new Date();
    nextSlot.setMinutes(Math.ceil(nextSlot.getMinutes() / 30) * 30, 0, 0);

    // Log de execução
    const executionDuration = Date.now() - startTime;
    await supabase
      .from('gsc_schedule_execution_logs')
      .insert({
        execution_type: 'scheduler',
        sites_processed: sitesProcessed,
        urls_scheduled: totalUrlsScheduled,
        integrations_used: integrationsUsed,
        total_capacity: totalCapacity,
        execution_duration_ms: executionDuration,
      });

    console.log(`🏁 Scheduler concluído: ${totalUrlsScheduled} URLs agendadas em ${sitesProcessed} sites`);

    return new Response(
      JSON.stringify({
        success: true,
        sites_processed: sitesProcessed,
        urls_scheduled: totalUrlsScheduled,
        total_capacity: totalCapacity,
        integrations_used: integrationsUsed,
        next_processing: nextSlot.toISOString(),
        execution_time_ms: executionDuration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Erro no scheduler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

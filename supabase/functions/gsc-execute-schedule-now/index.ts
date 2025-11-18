import { createClient } from 'npm:@supabase/supabase-js@2';
import { getIntegrationWithValidToken } from '../_shared/gsc-jwt-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🚀 GSC Execute Schedule Now - Manual execution');

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { schedule_id } = await req.json();

    if (!schedule_id) {
      throw new Error('schedule_id is required');
    }

    console.log(`📋 Executing schedule: ${schedule_id}`);

    // Buscar agendamento
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('gsc_sitemap_schedules')
      .select('*, rank_rent_sites(site_name, site_url)')
      .eq('id', schedule_id)
      .single();

    if (scheduleError || !schedule) {
      throw new Error(`Schedule not found: ${scheduleError?.message}`);
    }

    console.log(`✅ Schedule found: ${schedule.schedule_name}`);

    // Buscar integração(ões) - suporte para modo automático
    let integrationsToUse = [];

    if (schedule.integration_id) {
      // Modo manual: usar integração específica
      const integration = await getIntegrationWithValidToken(schedule.integration_id);
      integrationsToUse = [integration];
      console.log(`🔐 Using specific integration: ${integration.connection_name}`);
    } else {
      // Modo automático: buscar todas as integrações ativas
      const { data: allIntegrations, error: intError } = await supabaseAdmin
        .from('google_search_console_integrations')
        .select('*')
        .eq('site_id', schedule.site_id)
        .eq('is_active', true);
      
      if (intError || !allIntegrations || allIntegrations.length === 0) {
        throw new Error('No active integrations found for automatic distribution');
      }
      
      // Gerar tokens para todas
      integrationsToUse = await Promise.all(
        allIntegrations.map(int => getIntegrationWithValidToken(int.id))
      );
      
      console.log(`🔄 Using ${integrationsToUse.length} active integrations (automatic mode)`);
    }

    // Buscar sitemaps para enviar
    const { data: sitemaps, error: sitemapsError } = await supabaseAdmin
      .from('gsc_sitemap_submissions')
      .select('sitemap_url')
      .eq('site_id', schedule.site_id);

    if (sitemapsError) {
      throw new Error(`Failed to fetch sitemaps: ${sitemapsError.message}`);
    }

    // Filtrar sitemaps se específicos foram selecionados
    let sitemapsToSubmit = sitemaps?.map(s => s.sitemap_url) || [];
    
    if (schedule.sitemap_paths && schedule.sitemap_paths.length > 0) {
      sitemapsToSubmit = sitemapsToSubmit.filter(url => 
        schedule.sitemap_paths.some((path: string) => url.includes(path))
      );
    }

    console.log(`📊 Submitting ${sitemapsToSubmit.length} sitemaps`);

    const succeeded: string[] = [];
    const failed: string[] = [];
    const integrationUsage: Record<string, { succeeded: number; failed: number }> = {};

    // Inicializar contadores
    integrationsToUse.forEach(int => {
      integrationUsage[int.connection_name] = { succeeded: 0, failed: 0 };
    });

    // Distribuir sitemaps entre integrações (round-robin)
    for (let i = 0; i < sitemapsToSubmit.length; i++) {
      const sitemapUrl = sitemapsToSubmit[i];
      const integration = integrationsToUse[i % integrationsToUse.length]; // Round-robin
      
        try {
          console.log(`📤 [${integration.connection_name}] Submitting: ${sitemapUrl}`);
          
          const encodedSiteUrl = encodeURIComponent(integration.gsc_property_url);
          const encodedFeedpath = encodeURIComponent(sitemapUrl);
          
          const response = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

        if (response.ok) {
          succeeded.push(sitemapUrl);
          integrationUsage[integration.connection_name].succeeded++;
          console.log(`✅ Success via ${integration.connection_name}`);
        } else {
          const error = await response.text();
          failed.push(sitemapUrl);
          integrationUsage[integration.connection_name].failed++;
          console.error(`❌ Failed via ${integration.connection_name}: ${error}`);
        }
      } catch (error) {
        failed.push(sitemapUrl);
        integrationUsage[integration.connection_name].failed++;
        console.error(`❌ Error via ${integration.connection_name}:`, error);
      }
    }

    console.log('📊 Distribution summary:', integrationUsage);

    const executionTime = Date.now() - startTime;
    const status = failed.length === 0 ? 'success' : 
                   succeeded.length > 0 ? 'partial_success' : 'error';

    // Registrar log de execução
    const { error: logError } = await supabaseAdmin
      .from('gsc_schedule_execution_logs')
      .insert({
        schedule_id: schedule.id,
        status,
        sitemaps_attempted: sitemapsToSubmit,
        sitemaps_succeeded: succeeded,
        sitemaps_failed: failed,
        execution_duration_ms: executionTime,
        integration_id: schedule.integration_id, // NULL se automático
        integration_name: schedule.integration_id 
          ? integrationsToUse[0].connection_name 
          : `${integrationsToUse.length} integrações (automático)`,
        error_message: failed.length > 0 ? 
          `Failed: ${failed.length} | Distribution: ${JSON.stringify(integrationUsage)}` : null,
      });

    if (logError) {
      console.error('❌ Failed to log execution:', logError);
    }

    // Atualizar agendamento
    const nextRun = calculateNextRun(schedule.schedule_type, schedule.interval_hours);
    
    await supabaseAdmin
      .from('gsc_sitemap_schedules')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRun,
      })
      .eq('id', schedule.id);

    console.log(`✅ Execution completed in ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        status,
        sitemaps_attempted: sitemapsToSubmit.length,
        sitemaps_succeeded: succeeded.length,
        sitemaps_failed: failed.length,
        execution_time_ms: executionTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error executing schedule:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculateNextRun(scheduleType: string, intervalHours?: number): string {
  const now = new Date();
  
  switch (scheduleType) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'custom':
      if (intervalHours) {
        now.setHours(now.getHours() + intervalHours);
      }
      break;
  }
  
  return now.toISOString();
}

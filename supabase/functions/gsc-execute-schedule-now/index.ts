import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
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

    // Buscar integração
    const integration = await getIntegrationWithValidToken(schedule.integration_id);

    console.log(`🔐 Using integration: ${integration.connection_name}`);

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

    // Enviar cada sitemap
    for (const sitemapUrl of sitemapsToSubmit) {
      try {
        console.log(`📤 Submitting sitemap: ${sitemapUrl}`);
        
        const response = await fetch(
          `https://indexing.googleapis.com/v3/${encodeURIComponent(integration.gsc_property_url)}/sitemaps/${encodeURIComponent(sitemapUrl)}:submit`,
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
          console.log(`✅ Sitemap submitted successfully: ${sitemapUrl}`);
        } else {
          const error = await response.text();
          failed.push(sitemapUrl);
          console.error(`❌ Failed to submit ${sitemapUrl}: ${error}`);
        }
      } catch (error) {
        failed.push(sitemapUrl);
        console.error(`❌ Error submitting ${sitemapUrl}:`, error);
      }
    }

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
        integration_id: integration.id,
        integration_name: integration.connection_name,
        error_message: failed.length > 0 ? 
          `Failed to submit ${failed.length} sitemaps` : null,
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

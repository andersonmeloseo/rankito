import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getIntegrationWithValidToken } from '../_shared/gsc-jwt-auth.ts';

console.log('🕐 GSC Scheduled Sitemap Submissions - CRON Job Started');

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

try {
  const now = new Date().toISOString();
  
  // Buscar agendamentos ativos que devem rodar
  const { data: schedules, error: schedulesError } = await supabaseAdmin
    .from('gsc_sitemap_schedules')
    .select('*, rank_rent_sites(site_name, site_url)')
    .eq('is_active', true)
    .lte('next_run_at', now);

  if (schedulesError) {
    throw schedulesError;
  }

  if (!schedules || schedules.length === 0) {
    console.log('✅ No schedules to process at this time');
    Deno.exit(0);
  }

  console.log(`📋 Processing ${schedules.length} schedules`);

  for (const schedule of schedules) {
    const startTime = Date.now();
    console.log(`\n🔄 Processing schedule: ${schedule.schedule_name}`);

    try {
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

      // Buscar sitemaps
      const { data: sitemaps } = await supabaseAdmin
        .from('gsc_sitemap_submissions')
        .select('sitemap_url')
        .eq('site_id', schedule.site_id);

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

      // Log de execução
      await supabaseAdmin
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

      // Atualizar próxima execução
      const nextRun = calculateNextRun(schedule.schedule_type, schedule.interval_hours);
      
      await supabaseAdmin
        .from('gsc_sitemap_schedules')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRun,
        })
        .eq('id', schedule.id);

      console.log(`✅ Schedule completed: ${succeeded.length}/${sitemapsToSubmit.length} successful`);

    } catch (error) {
      console.error(`❌ Error processing schedule ${schedule.id}:`, error);
      
      // Log de erro
      await supabaseAdmin
        .from('gsc_schedule_execution_logs')
        .insert({
          schedule_id: schedule.id,
          status: 'error',
          sitemaps_attempted: [],
          sitemaps_succeeded: [],
          sitemaps_failed: [],
          execution_duration_ms: Date.now() - startTime,
          error_message: (error as Error).message,
        });
    }
  }

  console.log('\n✅ All schedules processed successfully');

} catch (error) {
  console.error('❌ CRON job failed:', error);
  Deno.exit(1);
}

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

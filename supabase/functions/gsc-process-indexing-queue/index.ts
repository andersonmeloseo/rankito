import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { 
  getIntegrationWithValidToken,
  markIntegrationUnhealthy,
  markIntegrationHealthy,
  isAuthError 
} from '../_shared/gsc-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_QUOTA_LIMIT = 200;
const MAX_RETRY_ATTEMPTS = 3;

// Retry com exponential backoff
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function indexUrlWithRetry(
  url: string,
  accessToken: string,
  attempts: number = 1
): Promise<any> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(
        'https://indexing.googleapis.com/v3/urlNotifications:publish',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            url,
            type: 'URL_UPDATED',
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      }

      // Se não é erro de auth e temos tentativas restantes, fazer retry
      if (!isAuthError(data) && attempt < attempts) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Retry ${attempt}/${attempts} after ${backoffMs}ms for ${url}`);
        await sleep(backoffMs);
        continue;
      }

      return { success: false, error: data };
    } catch (error) {
      if (attempt === attempts) {
        return { success: false, error };
      }
      const backoffMs = Math.pow(2, attempt) * 1000;
      await sleep(backoffMs);
    }
  }

  return { success: false, error: 'Max retry attempts reached' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let totalProcessed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let errorMessage: string | null = null;

  try {
    const { scheduled } = await req.json().catch(() => ({ scheduled: false }));
    const executionType = scheduled ? 'cron' : 'manual';
    
    console.log(`🔄 GSC Queue Processor - Started (${executionType}) at`, new Date().toISOString());
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Fetching active integrations...');

    // Buscar todas as integrações ativas
    const { data: integrations, error: integrationsError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('is_active', true)
      .not('service_account_json', 'is', null);

    if (integrationsError) {
      throw new Error(`Error fetching integrations: ${integrationsError.message}`);
    }

    if (!integrations || integrations.length === 0) {
      console.log('ℹ️ No active integrations found');
      const duration = Date.now() - startTime;
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active integrations',
          duration_ms: duration,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar integrações healthy ou que passaram do cooldown
    const now = Date.now();
    const healthyIntegrations = integrations.filter(int => {
      if (int.health_status === 'healthy') return true;
      if (int.health_status === 'unhealthy' && int.health_check_at) {
        const cooldownEnd = new Date(int.health_check_at).getTime();
        if (now > cooldownEnd) {
          console.log(`🔄 Integration ${int.connection_name} cooldown expired, retrying...`);
          return true;
        }
      }
      return false;
    });

    console.log(`✅ Found ${integrations.length} total, ${healthyIntegrations.length} healthy integrations`);

    if (healthyIntegrations.length === 0) {
      console.log('⚠️ No healthy integrations available');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No healthy integrations available',
          total_integrations: integrations.length,
          healthy_integrations: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Processar cada integração healthy
    for (const integration of healthyIntegrations) {
      try {
        console.log(`📊 Processing integration: ${integration.connection_name}`);

        // Verificar quota diária
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('gsc_url_indexing_requests')
          .select('*', { count: 'exact', head: true })
          .eq('integration_id', integration.id)
          .gte('submitted_at', `${today}T00:00:00Z`)
          .lte('submitted_at', `${today}T23:59:59Z`);

        const remainingQuota = DAILY_QUOTA_LIMIT - (todayCount || 0);

        if (remainingQuota <= 0) {
          console.log(`⚠️ Integration ${integration.connection_name}: Daily quota exhausted`);
          results.push({
            integration_id: integration.id,
            integration_name: integration.connection_name,
            status: 'quota_exhausted',
            processed: 0,
          });
          continue;
        }

        // Buscar URLs pendentes para hoje
        const { data: pendingUrls, error: queueError } = await supabase
          .from('gsc_indexing_queue')
          .select('*')
          .eq('integration_id', integration.id)
          .eq('status', 'pending')
          .lte('scheduled_for', today)
          .order('created_at', { ascending: true })
          .limit(remainingQuota);

        if (queueError) {
          throw new Error(`Error fetching queue: ${queueError.message}`);
        }

        if (!pendingUrls || pendingUrls.length === 0) {
          console.log(`ℹ️ Integration ${integration.connection_name}: No pending URLs`);
          results.push({
            integration_id: integration.id,
            integration_name: integration.connection_name,
            status: 'no_pending_urls',
            processed: 0,
          });
          continue;
        }

        // Obter access token válido
        let integrationData;
        try {
          integrationData = await getIntegrationWithValidToken(integration.id);
        } catch (error) {
          console.error(`❌ Failed to get token for ${integration.connection_name}:`, error);
          
          if (isAuthError(error)) {
            await markIntegrationUnhealthy(
              integration.id,
              error instanceof Error ? error.message : 'Token generation failed'
            );
          }
          
          results.push({
            integration_id: integration.id,
            integration_name: integration.connection_name,
            status: 'auth_error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          continue;
        }

        const accessToken = integrationData.access_token;
        let processed = 0;
        let failed = 0;

        // Processar cada URL com retry
        for (const queueItem of pendingUrls) {
          try {
            // Atualizar status para processing
            await supabase
              .from('gsc_indexing_queue')
              .update({ status: 'processing' })
              .eq('id', queueItem.id);

            // Tentar indexar com retry
            const result = await indexUrlWithRetry(
              queueItem.url,
              accessToken,
              MAX_RETRY_ATTEMPTS
            );

            if (result.success) {
              // Sucesso: atualizar queue e criar registro
              await supabase.from('gsc_indexing_queue').update({
                status: 'completed',
                processed_at: new Date().toISOString(),
              }).eq('id', queueItem.id);

              await supabase.from('gsc_url_indexing_requests').insert({
                integration_id: integration.id,
                page_id: queueItem.page_id,
                url: queueItem.url,
                request_type: 'URL_UPDATED',
                status: 'success',
                gsc_notification_id: result.data.urlNotificationMetadata?.url,
                gsc_response: result.data,
                submitted_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
              });

              // Atualizar batch se existir
              if (queueItem.batch_id) {
                const { data: batch } = await supabase
                  .from('gsc_indexing_batches')
                  .select('completed_urls')
                  .eq('id', queueItem.batch_id)
                  .single();
                
                if (batch) {
                  await supabase
                    .from('gsc_indexing_batches')
                    .update({ completed_urls: batch.completed_urls + 1 })
                    .eq('id', queueItem.batch_id);
                }
              }

              // Marcar integração como healthy (se estava unhealthy)
              if (integration.health_status === 'unhealthy') {
                await markIntegrationHealthy(integration.id);
              }

              processed++;
              console.log(`✅ Successfully indexed: ${queueItem.url}`);
            } else {
              throw result.error;
            }
          } catch (error) {
            console.error(`❌ Failed to index ${queueItem.url}:`, error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

            // Se erro de auth, marcar integração como unhealthy
            if (isAuthError(error)) {
              await markIntegrationUnhealthy(integration.id, errorMessage);
              console.log(`⚠️ Auth error detected, stopping processing for ${integration.connection_name}`);
              break; // Para de processar esta integração
            }

            // Atualizar queue com erro
            await supabase.from('gsc_indexing_queue').update({
              status: 'failed',
              error_message: errorMessage,
              attempts: queueItem.attempts + 1,
              processed_at: new Date().toISOString(),
            }).eq('id', queueItem.id);

            // Se menos de 3 tentativas, reagendar para amanhã
            if (queueItem.attempts < 2) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              
              await supabase.from('gsc_indexing_queue').insert({
                integration_id: queueItem.integration_id,
                page_id: queueItem.page_id,
                url: queueItem.url,
                scheduled_for: tomorrow.toISOString().split('T')[0],
                batch_id: queueItem.batch_id,
                attempts: queueItem.attempts + 1,
              });
            }

            // Atualizar batch se existir
            if (queueItem.batch_id) {
              const { data: batch } = await supabase
                .from('gsc_indexing_batches')
                .select('failed_urls')
                .eq('id', queueItem.batch_id)
                .single();
              
              if (batch) {
                await supabase
                  .from('gsc_indexing_batches')
                  .update({ failed_urls: batch.failed_urls + 1 })
                  .eq('id', queueItem.batch_id);
              }
            }

            failed++;
          }
        }

        // Atualizar status dos batches completados
        const { data: batches } = await supabase
          .from('gsc_indexing_batches')
          .select('id, total_urls, completed_urls, failed_urls')
          .eq('integration_id', integration.id)
          .eq('status', 'processing');

        if (batches) {
          for (const batch of batches) {
            if (batch.completed_urls + batch.failed_urls >= batch.total_urls) {
              await supabase.from('gsc_indexing_batches').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              }).eq('id', batch.id);
            }
          }
        }

        results.push({
          integration_id: integration.id,
          integration_name: integration.connection_name,
          status: 'success',
          processed,
          failed,
        });

        console.log(`✅ Integration ${integration.connection_name}: Processed ${processed}, Failed ${failed}`);
      } catch (error) {
        console.error(`❌ Error processing integration ${integration.connection_name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          integration_id: integration.id,
          integration_name: integration.connection_name,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    const duration = Date.now() - startTime;
    totalProcessed = results.reduce((sum, r) => sum + (r.processed || 0), 0);
    totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);

    console.log(`✅ Queue processing complete in ${duration}ms`);
    console.log('📊 Final stats:', {
      total_integrations: integrations.length,
      healthy_integrations: healthyIntegrations.length,
      total_processed: totalProcessed,
      total_failed: totalFailed,
      duration_ms: duration,
    });

    // Save execution log
    await supabase
      .from('gsc_queue_execution_logs')
      .insert({
        total_processed: totalProcessed,
        total_failed: totalFailed,
        total_skipped: totalSkipped,
        duration_ms: duration,
        execution_type: executionType,
      });

    return new Response(
      JSON.stringify({
        success: true,
        total_integrations: integrations.length,
        healthy_integrations: healthyIntegrations.length,
        processed_integrations: results.filter(r => r.status === 'success').length,
        total_processed: totalProcessed,
        total_failed: totalFailed,
        duration_ms: duration,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Queue processor error:', error);
    errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Save error log
    const duration = Date.now() - startTime;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabase
      .from('gsc_queue_execution_logs')
      .insert({
        total_processed: totalProcessed,
        total_failed: totalFailed,
        total_skipped: totalSkipped,
        duration_ms: duration,
        error_message: errorMessage,
        execution_type: 'manual',
      });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { getIntegrationWithValidToken } from '../_shared/gsc-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_QUOTA_LIMIT = 200;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting indexing queue processor...');

    // Buscar todas as integrações ativas
    const { data: integrations, error: integrationsError } = await supabase
      .from('google_search_console_integrations')
      .select('id, user_id')
      .eq('is_active', true)
      .not('service_account_json', 'is', null);

    if (integrationsError) {
      throw new Error(`Error fetching integrations: ${integrationsError.message}`);
    }

    if (!integrations || integrations.length === 0) {
      console.log('ℹ️ No active integrations found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active integrations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Processar cada integração
    for (const integration of integrations) {
      try {
        console.log(`📊 Processing integration: ${integration.id}`);

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
          console.log(`⚠️ Integration ${integration.id}: Daily quota exhausted`);
          results.push({
            integration_id: integration.id,
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
          console.log(`ℹ️ Integration ${integration.id}: No pending URLs`);
          results.push({
            integration_id: integration.id,
            status: 'no_pending_urls',
            processed: 0,
          });
          continue;
        }

        // Obter access token válido
        const integrationData = await getIntegrationWithValidToken(integration.id);
        const accessToken = integrationData.accessToken;

        let processed = 0;
        let failed = 0;

        // Processar cada URL
        for (const queueItem of pendingUrls) {
          try {
            // Atualizar status para processing
            await supabase
              .from('gsc_indexing_queue')
              .update({ status: 'processing' })
              .eq('id', queueItem.id);

            // Enviar request para Google Indexing API
            const indexingResponse = await fetch(
              'https://indexing.googleapis.com/v3/urlNotifications:publish',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  url: queueItem.url,
                  type: 'URL_UPDATED',
                }),
              }
            );

            const indexingData = await indexingResponse.json();

            if (indexingResponse.ok) {
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
                gsc_notification_id: indexingData.urlNotificationMetadata?.url,
                gsc_response: indexingData,
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

              processed++;
              console.log(`✅ Successfully indexed: ${queueItem.url}`);
            } else {
              throw new Error(indexingData.error?.message || 'Indexing failed');
            }
          } catch (error) {
            console.error(`❌ Failed to index ${queueItem.url}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
          status: 'success',
          processed,
          failed,
        });

        console.log(`✅ Integration ${integration.id}: Processed ${processed}, Failed ${failed}`);
      } catch (error) {
        console.error(`❌ Error processing integration ${integration.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          integration_id: integration.id,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_integrations: integrations.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Queue processor error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

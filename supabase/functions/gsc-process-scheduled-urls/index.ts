import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { getIntegrationWithValidToken } from '../_shared/gsc-helpers.ts';
import { selectBestIntegration } from '../_shared/gsc-rotation-helpers.ts';

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

    console.log('⚙️ GSC Process Scheduled URLs - Starting');

    // Buscar submissões pendentes cujo horário chegou
    const { data: submissions, error: subError } = await supabase
      .from('gsc_scheduled_submissions')
      .select('*, integration:google_search_console_integrations(id, connection_name)')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(10); // Processar até 10 submissões por vez

    if (subError) throw subError;

    if (!submissions || submissions.length === 0) {
      console.log('⚠️ Nenhuma submissão pendente para processar');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma submissão pendente' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`📋 ${submissions.length} submissões para processar`);

    let totalUrlsSuccessful = 0;
    let totalUrlsFailed = 0;
    let submissionsProcessed = 0;

    for (const submission of submissions) {
      try {
        // Marcar como processando
        await supabase
          .from('gsc_scheduled_submissions')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
          })
          .eq('id', submission.id);

        const urls = submission.urls || [];
        console.log(`📤 Processando submissão ${submission.id}: ${urls.length} URLs`);

        // **FASE 2: BUSCAR TODAS INTEGRAÇÕES SAUDÁVEIS (não apenas 1)**
        const { data: allIntegrations, error: intError } = await supabase
          .from('google_search_console_integrations')
          .select('*')
          .eq('site_id', submission.site_id)
          .eq('is_active', true)
          .eq('health_status', 'healthy');

        if (intError || !allIntegrations || allIntegrations.length === 0) {
          throw new Error('Nenhuma integração saudável disponível');
        }

        console.log(`🔍 Found ${allIntegrations.length} healthy integrations for rotation`);

        let successful = 0;
        let failed = 0;
        const processedByIntegration = new Map<string, number>();

        // **ROTACIONAR AUTOMATICAMENTE ENTRE INTEGRAÇÕES**
        for (const url of urls) {
          try {
            // Selecionar melhor integração DINAMICAMENTE para cada URL
            const bestIntegration = await selectBestIntegration(supabase as any, allIntegrations);

            if (!bestIntegration || bestIntegration.remaining <= 0) {
              console.log('⚠️ Todas integrações esgotaram quota, reagendando...');
              
              // Reagendar para amanhã
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 30, 0, 0);

              await supabase
                .from('gsc_scheduled_submissions')
                .update({
                  status: 'pending',
                  scheduled_for: tomorrow.toISOString(),
                  started_at: null,
                  urls_submitted: successful + failed,
                  urls_successful: successful,
                  urls_failed: failed,
                })
                .eq('id', submission.id);

              break; // Parar processamento desta submissão
            }

            const integrationName = allIntegrations.find(i => i.id === bestIntegration.id)?.connection_name || 'Unknown';
            console.log(`🔄 Using integration: ${integrationName} (${bestIntegration.remaining} URLs remaining)`);

            // Rastrear uso por integração
            const currentCount = processedByIntegration.get(bestIntegration.id) || 0;
            processedByIntegration.set(bestIntegration.id, currentCount + 1);

            const { access_token } = await getIntegrationWithValidToken(bestIntegration.id);

            // Indexar URL via GSC API
            const indexResponse = await fetch(
              `https://indexing.googleapis.com/v3/urlNotifications:publish`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify({
                  url: url,
                  type: 'URL_UPDATED',
                }),
              }
            );

            if (indexResponse.ok) {
              successful++;
              
              // Registrar em gsc_url_indexing_requests
              await supabase
                .from('gsc_url_indexing_requests')
                .insert({
                  site_id: submission.site_id,
                  integration_id: bestIntegration.id,
                  url: url,
                  status: 'sent',
                  response_data: await indexResponse.json(),
                });

              // Atualizar status em gsc_discovered_urls
              await supabase
                .from('gsc_discovered_urls')
                .update({
                  current_status: 'sent',
                  last_checked_at: new Date().toISOString(),
                  integration_id: bestIntegration.id,
                })
                .eq('site_id', submission.site_id)
                .eq('url', url);

              console.log(`✅ URL indexed successfully: ${url}`);

            } else {
              failed++;
              const errorData = await indexResponse.json();
              
              await supabase
                .from('gsc_url_indexing_requests')
                .insert({
                  site_id: submission.site_id,
                  integration_id: bestIntegration.id,
                  url: url,
                  status: 'failed',
                  error_message: errorData.error?.message || 'Unknown error',
                  response_data: errorData,
                });

              console.error(`❌ URL indexing failed: ${url}`, errorData.error?.message);
            }

            // Rate limiting: aguardar entre requisições
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (urlError: any) {
            console.error(`❌ Erro ao indexar ${url}:`, urlError.message);
            failed++;
          }
        }

        // Log da distribuição
        console.log(`\n📊 Distribution summary for submission ${submission.id}:`);
        for (const [integrationId, count] of processedByIntegration) {
          const integration = allIntegrations.find(i => i.id === integrationId);
          console.log(`  - ${integration?.connection_name}: ${count} URLs`);
        }

        // Atualizar submissão com resultados
        await supabase
          .from('gsc_scheduled_submissions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            urls_submitted: successful + failed,
            urls_successful: successful,
            urls_failed: failed,
          })
          .eq('id', submission.id);

        totalUrlsSuccessful += successful;
        totalUrlsFailed += failed;
        submissionsProcessed++;

        console.log(`✅ Submissão ${submission.id}: ${successful} OK, ${failed} falhas`);

      } catch (error: any) {
        console.error(`❌ Erro ao processar submissão ${submission.id}:`, error);
        
        // Marcar como falha
        await supabase
          .from('gsc_scheduled_submissions')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error.message,
          })
          .eq('id', submission.id);
      }
    }

    // Log de execução
    const executionDuration = Date.now() - startTime;
    await supabase
      .from('gsc_schedule_execution_logs')
      .insert({
        execution_type: 'processor',
        sites_processed: 0,
        urls_processed: totalUrlsSuccessful + totalUrlsFailed,
        execution_duration_ms: executionDuration,
      });

    console.log(`🏁 Processor concluído: ${submissionsProcessed} submissões, ${totalUrlsSuccessful} URLs enviadas`);

    return new Response(
      JSON.stringify({
        success: true,
        submissions_processed: submissionsProcessed,
        urls_successful: totalUrlsSuccessful,
        urls_failed: totalUrlsFailed,
        execution_time_ms: executionDuration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

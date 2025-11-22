import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getIntegrationWithValidToken } from "../_shared/gsc-helpers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calcula próximo retry com backoff exponencial:
 * - 1ª tentativa: 1 hora
 * - 2ª tentativa: 6 horas
 * - 3ª tentativa: 24 horas
 */
function calculateNextRetry(retryCount: number): Date | null {
  const backoffHours = [1, 6, 24];
  if (retryCount >= 3) return null; // Máximo 3 tentativas
  
  const hours = backoffHours[retryCount];
  const nextRetry = new Date();
  nextRetry.setHours(nextRetry.getHours() + hours);
  return nextRetry;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [gsc-process-retries] Starting retry processing');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar URLs agendadas para retry que chegaram no horário
    const { data: urlsToRetry, error: fetchError } = await supabase
      .from('gsc_discovered_urls')
      .select('*')
      .not('next_retry_at', 'is', null)
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 3)
      .order('next_retry_at', { ascending: true })
      .limit(100); // Processar 100 por vez

    if (fetchError) {
      throw fetchError;
    }

    if (!urlsToRetry || urlsToRetry.length === 0) {
      console.log('✅ No URLs pending retry');
      return new Response(JSON.stringify({ message: 'No URLs to retry', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`📋 Found ${urlsToRetry.length} URLs to retry`);

    let successCount = 0;
    let failedCount = 0;

    // Agrupar por site_id para reusar integração
    const urlsBySite = new Map<string, typeof urlsToRetry>();
    for (const url of urlsToRetry) {
      if (!urlsBySite.has(url.site_id)) {
        urlsBySite.set(url.site_id, []);
      }
      urlsBySite.get(url.site_id)!.push(url);
    }

    // Processar cada site
    for (const [siteId, urls] of urlsBySite.entries()) {
      try {
        // Buscar integração saudável
        const { data: integrations } = await supabase
          .from('google_search_console_integrations')
          .select('*')
          .eq('site_id', siteId)
          .eq('is_active', true)
          .eq('health_status', 'healthy')
          .order('success_rate', { ascending: false });

        if (!integrations || integrations.length === 0) {
          console.warn(`⚠️ No healthy integrations for site ${siteId}, skipping`);
          continue;
        }

        const integration = integrations[0];
        const integrationData = await getIntegrationWithValidToken(integration);
        const accessToken = integrationData.accessToken;

        // Processar URLs deste site
        for (const urlData of urls) {
          try {
            // Tentar indexar novamente
            const gscResponse = await fetch(
              `https://indexing.googleapis.com/v3/urlNotifications:publish`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  url: urlData.url,
                  type: 'URL_UPDATED',
                }),
              }
            );

            const responseData = await gscResponse.json();

            if (gscResponse.ok) {
              // Sucesso - limpar retry info
              await supabase
                .from('gsc_discovered_urls')
                .update({
                  retry_count: 0,
                  last_retry_at: new Date().toISOString(),
                  next_retry_at: null,
                  retry_reason: null,
                  current_status: 'sent',
                  updated_at: new Date().toISOString()
                })
                .eq('id', urlData.id);

              // Registrar requisição bem-sucedida
              await supabase
                .from('gsc_url_indexing_requests')
                .insert({
                  site_id: siteId,
                  integration_id: integration.id,
                  url: urlData.url,
                  status: 'success',
                  response_data: responseData
                });

              successCount++;
              console.log(`✅ Retry successful for ${urlData.url}`);
            } else {
              // Falhou - incrementar retry_count e reagendar
              const newRetryCount = (urlData.retry_count || 0) + 1;
              const nextRetry = calculateNextRetry(newRetryCount);

              await supabase
                .from('gsc_discovered_urls')
                .update({
                  retry_count: newRetryCount,
                  last_retry_at: new Date().toISOString(),
                  next_retry_at: nextRetry?.toISOString() || null,
                  retry_reason: responseData.error?.status === 'RESOURCE_EXHAUSTED' ? 'quota_exceeded' : 'temporary_error',
                  updated_at: new Date().toISOString()
                })
                .eq('id', urlData.id);

              // Registrar falha
              await supabase
                .from('gsc_url_indexing_requests')
                .insert({
                  site_id: siteId,
                  integration_id: integration.id,
                  url: urlData.url,
                  status: 'failed',
                  error_message: JSON.stringify(responseData),
                  response_data: responseData
                });

              failedCount++;
              console.warn(`⚠️ Retry failed for ${urlData.url} (attempt ${newRetryCount}/3)`);
            }
          } catch (urlError: any) {
            console.error(`❌ Error retrying URL ${urlData.url}:`, urlError);
            failedCount++;
          }
        }
      } catch (siteError: any) {
        console.error(`❌ Error processing site ${siteId}:`, siteError);
      }
    }

    console.log(`✅ Retry processing complete: ${successCount} success, ${failedCount} failed`);

    return new Response(JSON.stringify({
      message: 'Retry processing complete',
      processed: urlsToRetry.length,
      success: successCount,
      failed: failedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ Error in gsc-process-retries:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro desconhecido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

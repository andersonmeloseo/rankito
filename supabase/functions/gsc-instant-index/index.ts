import { createClient } from 'npm:@supabase/supabase-js@2';
import { getIntegrationWithValidToken, markIntegrationUnhealthy, markIntegrationHealthy } from '../_shared/gsc-jwt-auth.ts';
import { distributeUrls } from '../_shared/gsc-rotation-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Categoriza erros por tipo
 */
function categorizeError(error: any, context: string): string {
  if (context === 'gsc') {
    if (error.status === 401 || error.status === 403) return 'gsc_auth_failed';
    if (error.message?.includes('quota')) return 'quota_exceeded';
  }

  return 'api_error';
}

/**
 * Envia URL para GSC Indexing API
 */
async function sendToGSC(url: string, accessToken: string): Promise<{ success: boolean; error?: any }> {
  try {
    const response = await fetch(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          url,
          type: 'URL_UPDATED',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorType = categorizeError({ status: response.status, message: data.error?.message }, 'gsc');
      return { success: false, error: { type: errorType, data } };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('📤 GSC Instant Index - Request received');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { site_id, urls, integration_id } = await req.json();

    if (!site_id || !urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, urls (array)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Indexing ${urls.length} URLs for site ${site_id}`);

    // Verificar se site existe
    const { data: site, error: siteError } = await supabase
      .from('rank_rent_sites')
      .select('id')
      .eq('id', site_id)
      .single();

    if (siteError || !site) {
      throw new Error('Site not found');
    }

    // **FASE 1: DISTRIBUIÇÃO INTELIGENTE**
    // Buscar TODAS integrações ativas (não apenas 1)
    const { data: allIntegrations, error: intError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('site_id', site_id)
      .eq('is_active', true);

    if (intError || !allIntegrations || allIntegrations.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No active GSC integration found for this site. Please configure at least one GSC integration in the Configuração tab.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${allIntegrations.length} active integrations for distribution`);

    // Distribuir URLs uniformemente entre integrações
    const distribution = await distributeUrls(supabase as any, allIntegrations, urls, 'even');

    // Logging detalhado da distribuição
    console.log(`🔀 URL distribution across ${distribution.size} integrations:`);
    let distributionLog = '';
    for (const [integrationId, urlsForIntegration] of distribution) {
      const integration = allIntegrations.find(i => i.id === integrationId);
      distributionLog += `\n  - ${integration?.connection_name || integrationId}: ${urlsForIntegration.length} URLs`;
    }
    console.log(distributionLog);

    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;
    const jobsByIntegration = new Map();

    // Processar URLs por integração
    for (const [integrationId, urlsForIntegration] of distribution) {
      const integration = allIntegrations.find(i => i.id === integrationId);
      if (!integration) continue;

      console.log(`\n📤 Processing ${urlsForIntegration.length} URLs with integration: ${integration.connection_name}`);

      // Buscar token válido para esta integração
      const { access_token } = await getIntegrationWithValidToken(integrationId);

      // Criar job para esta integração
      const { data: job, error: jobError } = await supabase
        .from('gsc_indexing_jobs')
        .insert({
          site_id,
          integration_id: integrationId,
          job_type: 'instant',
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) {
        console.error(`❌ Failed to create job for ${integration.connection_name}:`, jobError);
        continue;
      }

      jobsByIntegration.set(integrationId, job);

      let integrationSuccessCount = 0;
      let integrationFailCount = 0;

      // Processar cada URL desta integração
      for (const url of urlsForIntegration) {
        const urlResult: any = { url, gsc: null, integration: integration.connection_name };

        // Enviar para GSC
        const gscResult = await sendToGSC(url, access_token);
        urlResult.gsc = gscResult.success ? 'success' : 'failed';

        if (!gscResult.success) {
          console.error(`❌ GSC failed for ${url}:`, gscResult.error);
        } else {
          console.log(`✅ GSC success for ${url}`);
        }

        const overallSuccess = urlResult.gsc === 'success';
        
        // Detectar se é erro de quota
        const isQuotaError = !overallSuccess && (
          gscResult.error?.type === 'quota_exceeded' ||
          gscResult.error?.data?.error?.status === 'RESOURCE_EXHAUSTED' ||
          gscResult.error?.data?.error?.message?.toLowerCase().includes('quota')
        );
        
        // Detectar tipo de erro para retry
        let retryReason = null;
        if (!overallSuccess) {
          if (isQuotaError) {
            retryReason = 'quota_exceeded';
          } else if (gscResult.error?.data?.error?.status === 'RATE_LIMIT_EXCEEDED') {
            retryReason = 'rate_limit';
          } else if (gscResult.error?.type === 'auth_error') {
            retryReason = 'auth_error';
          } else {
            retryReason = 'temporary_error';
          }
        }

        // Registrar na tabela de quota
        await supabase
          .from('gsc_url_indexing_requests')
          .insert({
            site_id: site_id,
            integration_id: integrationId,
            url: url,
            status: overallSuccess ? 'success' : 'failed',
            error_message: !overallSuccess ? JSON.stringify(gscResult.error) : null,
            response_data: gscResult,
          });

        // Atualizar status e configurar retry se necessário
        if (!isQuotaError) {
          const { data: currentUrl } = await supabase
            .from('gsc_discovered_urls')
            .select('retry_count')
            .eq('site_id', site_id)
            .eq('url', url)
            .maybeSingle();
          
          const currentRetryCount = currentUrl?.retry_count || 0;
          
          let nextRetryAt = null;
          if (!overallSuccess && currentRetryCount < 3 && retryReason !== 'auth_error') {
            const backoffHours = [1, 6, 24];
            const hours = backoffHours[currentRetryCount];
            nextRetryAt = new Date();
            nextRetryAt.setHours(nextRetryAt.getHours() + hours);
          }
          
          await supabase
            .from('gsc_discovered_urls')
            .update({
              current_status: overallSuccess ? 'sent' : 'failed',
              last_checked_at: new Date().toISOString(),
              retry_count: overallSuccess ? 0 : (currentRetryCount + 1),
              last_retry_at: !overallSuccess ? new Date().toISOString() : null,
              next_retry_at: nextRetryAt ? nextRetryAt.toISOString() : null,
              retry_reason: !overallSuccess ? retryReason : null,
              integration_id: integrationId, // Armazenar qual integração processou
            })
            .eq('site_id', site_id)
            .eq('url', url);
        } else {
          console.log(`⏭️ Quota exceeded for ${url} - preserving current status`);
        }

        if (overallSuccess) {
          successCount++;
          integrationSuccessCount++;
        } else {
          failCount++;
          integrationFailCount++;
        }

        results.push(urlResult);

        // Rate limiting entre requisições
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Atualizar job desta integração
      const duration = Date.now() - startTime;
      await supabase
        .from('gsc_indexing_jobs')
        .update({
          status: 'completed',
          urls_processed: urlsForIntegration.length,
          urls_successful: integrationSuccessCount,
          urls_failed: integrationFailCount,
          completed_at: new Date().toISOString(),
          results: { 
            urls: results.filter(r => r.integration === integration.connection_name), 
            duration_ms: duration 
          },
        })
        .eq('id', job.id);

      // Atualizar health status
      if (integrationFailCount === urlsForIntegration.length) {
        await markIntegrationUnhealthy(integrationId, 'All indexing requests failed');
      } else if (integrationSuccessCount > 0) {
        await markIntegrationHealthy(integrationId);
      }

      console.log(`✅ Integration ${integration.connection_name}: ${integrationSuccessCount} success, ${integrationFailCount} failed`);
    }

    console.log(`\n🏁 Indexing completed: ${successCount} success, ${failCount} failed across ${distribution.size} integrations`);

    return new Response(
      JSON.stringify({
        success: true,
        urls_processed: urls.length,
        urls_successful: successCount,
        urls_failed: failCount,
        integrations_used: distribution.size,
        results,
        duration_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getIntegrationWithValidToken, markIntegrationUnhealthy, markIntegrationHealthy } from '../_shared/gsc-jwt-auth.ts';

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

/**
 * Busca automaticamente uma integração ativa para o site
 * Prioriza integrações com health_status = 'healthy'
 */
async function findActiveIntegration(supabase: any, siteId: string): Promise<string | null> {
  console.log(`🔍 Auto-detecting GSC integration for site ${siteId}...`);
  
  // Buscar integração healthy ativa
  const { data: healthyIntegration } = await supabase
    .from('google_search_console_integrations')
    .select('id')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .eq('health_status', 'healthy')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (healthyIntegration) {
    console.log(`✅ Found healthy integration: ${healthyIntegration.id}`);
    return healthyIntegration.id;
  }
  
  // Fallback: buscar qualquer integração ativa
  const { data: anyIntegration } = await supabase
    .from('google_search_console_integrations')
    .select('id')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (anyIntegration) {
    console.log(`⚠️ Found active integration (not healthy): ${anyIntegration.id}`);
    return anyIntegration.id;
  }
  
  console.log(`❌ No active integration found for site ${siteId}`);
  return null;
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

    // Auto-detectar integração se não fornecida
    let finalIntegrationId = integration_id;

    if (!finalIntegrationId) {
      console.log('🔄 No integration_id provided, auto-detecting...');
      finalIntegrationId = await findActiveIntegration(supabase, site_id);
      
      if (!finalIntegrationId) {
        return new Response(
          JSON.stringify({ 
            error: 'No active GSC integration found for this site. Please configure at least one GSC integration in the Configuração tab.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar integração
    const integration = await getIntegrationWithValidToken(finalIntegrationId);

    // Criar job
    const { data: job, error: jobError } = await supabase
      .from('gsc_indexing_jobs')
      .insert({
        site_id,
        integration_id: finalIntegrationId,
        job_type: 'instant',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    console.log(`✅ Job created: ${job.id}`);

    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;

    // Processar cada URL
    for (const url of urls) {
      const urlResult: any = { url, gsc: null };

      // Enviar para GSC
      const gscResult = await sendToGSC(url, integration.access_token);
      urlResult.gsc = gscResult.success ? 'success' : 'failed';

      if (!gscResult.success) {
        console.error(`❌ GSC failed for ${url}:`, gscResult.error);
      } else {
        console.log(`✅ GSC success for ${url}`);
      }

      // Status baseado apenas no GSC
      const overallSuccess = urlResult.gsc === 'success';
      
      // Detectar se é erro de quota (429 ou rate limit)
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

      // REGISTRAR URL NA TABELA DE QUOTA
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Inserir registro de requisição para rastreamento de quota
      await supabaseAdmin
        .from('gsc_url_indexing_requests')
        .insert({
          site_id: site_id,
          integration_id: finalIntegrationId,
          url: url,
          status: overallSuccess ? 'success' : 'failed',
          error_message: !overallSuccess ? JSON.stringify(gscResult.error) : null,
          response_data: gscResult,
        });

      // Atualizar status e configurar retry se necessário
      if (!isQuotaError) {
        // Buscar retry_count atual
        const { data: currentUrl } = await supabaseAdmin
          .from('gsc_discovered_urls')
          .select('retry_count')
          .eq('site_id', site_id)
          .eq('url', url)
          .maybeSingle();
        
        const currentRetryCount = currentUrl?.retry_count || 0;
        
        // Calcular próximo retry se falhou e ainda não atingiu limite
        let nextRetryAt = null;
        if (!overallSuccess && currentRetryCount < 3 && retryReason !== 'auth_error') {
          const backoffHours = [1, 6, 24];
          const hours = backoffHours[currentRetryCount];
          nextRetryAt = new Date();
          nextRetryAt.setHours(nextRetryAt.getHours() + hours);
        }
        
        const { error: updateError } = await supabaseAdmin
          .from('gsc_discovered_urls')
          .update({
            current_status: overallSuccess ? 'sent' : 'failed',
            last_checked_at: new Date().toISOString(),
            retry_count: overallSuccess ? 0 : (currentRetryCount + 1),
            last_retry_at: !overallSuccess ? new Date().toISOString() : null,
            next_retry_at: nextRetryAt ? nextRetryAt.toISOString() : null,
            retry_reason: !overallSuccess ? retryReason : null,
          })
          .eq('site_id', site_id)
          .eq('url', url);
        
        if (updateError) {
          console.error(`⚠️ Failed to update status for ${url}:`, updateError);
        } else {
          console.log(`✅ Status updated to '${overallSuccess ? 'sent' : 'failed'}' for ${url}${!overallSuccess && nextRetryAt ? ` (retry scheduled for ${nextRetryAt.toISOString()})` : ''}`);
        }
      } else {
        console.log(`⏭️ Quota exceeded for ${url} - preserving current status`);
      }

      if (overallSuccess) {
        successCount++;
      } else {
        failCount++;
      }

      results.push(urlResult);
    }

    // Atualizar job
    const duration = Date.now() - startTime;
    await supabase
      .from('gsc_indexing_jobs')
      .update({
        status: 'completed',
        urls_processed: urls.length,
        urls_successful: successCount,
        urls_failed: failCount,
        completed_at: new Date().toISOString(),
        results: { urls: results, duration_ms: duration },
      })
      .eq('id', job.id);

    // Atualizar health status da integração
    if (failCount === urls.length) {
      await markIntegrationUnhealthy(finalIntegrationId, 'All indexing requests failed');
    } else if (successCount > 0) {
      await markIntegrationHealthy(finalIntegrationId);
    }

    console.log(`✅ Indexing completed: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        urls_processed: urls.length,
        urls_successful: successCount,
        urls_failed: failCount,
        job_id: job.id,
        results,
        duration_ms: duration,
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

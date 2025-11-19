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
  if (context === 'indexnow') {
    if (error.status === 404) return 'indexnow_file_not_found';
    if (error.status === 429) return 'rate_limit_exceeded';
  }

  if (context === 'gsc') {
    if (error.status === 401 || error.status === 403) return 'gsc_auth_failed';
    if (error.message?.includes('quota')) return 'quota_exceeded';
  }

  return 'api_error';
}

/**
 * Envia URLs para IndexNow API
 */
async function sendToIndexNow(
  domain: string,
  urls: string[],
  indexnowKey: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const payload = {
      host: domain,
      key: indexnowKey,
      keyLocation: `https://${domain}/${indexnowKey}.txt`,
      urlList: urls,
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorType = categorizeError({ status: response.status }, 'indexnow');
      return { success: false, error: { type: errorType, status: response.status } };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
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

    // Buscar site
    const { data: site, error: siteError } = await supabase
      .from('rank_rent_sites')
      .select('indexnow_key')
      .eq('id', site_id)
      .single();

    if (siteError || !site) {
      throw new Error('Site not found');
    }

    // Buscar integração
    const integration = integration_id
      ? await getIntegrationWithValidToken(integration_id)
      : null;

    // Criar job
    const { data: job, error: jobError } = await supabase
      .from('gsc_indexing_jobs')
      .insert({
        site_id,
        integration_id: integration_id || null,
        job_type: 'manual',
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
      const urlResult: any = { url, indexnow: null, gsc: null };

      // Enviar para IndexNow se key configurada
      if (site.indexnow_key) {
        const domain = new URL(url).hostname;
        const indexNowResult = await sendToIndexNow(domain, [url], site.indexnow_key);
        urlResult.indexnow = indexNowResult.success ? 'success' : 'failed';

        if (!indexNowResult.success) {
          console.error(`❌ IndexNow failed for ${url}:`, indexNowResult.error);
        }
      }

      // Enviar para GSC se integração configurada
      if (integration) {
        const gscResult = await sendToGSC(url, integration.access_token);
        urlResult.gsc = gscResult.success ? 'success' : 'failed';

        if (!gscResult.success) {
          console.error(`❌ GSC failed for ${url}:`, gscResult.error);
        }
      }

      // Atualizar status da URL
      const overallSuccess = urlResult.indexnow === 'success' || urlResult.gsc === 'success';
      
      await supabase
        .from('gsc_discovered_urls')
        .upsert({
          site_id,
          url,
          current_status: overallSuccess ? 'sent_for_indexing' : 'failed',
          last_checked_at: new Date().toISOString(),
        }, {
          onConflict: 'site_id,url',
          ignoreDuplicates: false,
        });

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
    if (integration_id) {
      if (failCount === urls.length) {
        await markIntegrationUnhealthy(integration_id, 'All indexing requests failed');
      } else if (successCount > 0) {
        await markIntegrationHealthy(integration_id);
      }
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

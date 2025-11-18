import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, siteId, userId } = await req.json();

    // Validações iniciais
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new Error('URLs array is required and must not be empty');
    }
    if (!siteId) throw new Error('Site ID is required');
    if (!userId) throw new Error('User ID is required');

    // Buscar informações do site
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: site, error: siteError } = await supabase
      .from('rank_rent_sites')
      .select('indexnow_key, site_url')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      throw new Error('Site not found or error fetching site data');
    }

    const key = site.indexnow_key;
    const host = site.site_url;

    if (!key) throw new Error('IndexNow API key not configured for this site');
    if (!host) throw new Error('Site URL not configured');

    console.log('IndexNow submission request:', { urlsCount: urls?.length, host, siteId });

    // Limpar e validar URLs
    const validUrls = urls
      .map(url => url.trim())
      .filter(url => url && url.length > 0);

    if (validUrls.length === 0) {
      throw new Error('No valid URLs provided');
    }

    // Construir payload IndexNow
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const payload = {
      host: cleanHost,
      key: key,
      keyLocation: `https://${cleanHost}/${key}.txt`,
      urlList: validUrls
    };

    console.log('Submitting to IndexNow API:', { host: payload.host, urlCount: payload.urlList.length });

    // POST para IndexNow API
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    const statusCode = response.status;
    let responseData = null;
    
    try {
      const text = await response.text();
      responseData = text || null;
    } catch (e) {
      console.error('Error reading response:', e);
      responseData = null;
    }

    console.log('IndexNow API response:', { statusCode, responseData });

    // IndexNow retorna:
    // - 200: OK (success)
    // - 202: Accepted (queued)
    // - 400: Bad request
    // - 403: Forbidden
    // - 422: Unprocessable Entity
    // - 429: Too Many Requests
    const success = statusCode === 200 || statusCode === 202;

    // Salvar no banco (supabase client já foi criado acima)
    const { error: dbError } = await supabase.from('indexnow_submissions').insert({
      site_id: siteId,
      user_id: userId,
      urls_count: validUrls.length,
      status: success ? 'success' : 'failed',
      status_code: statusCode,
      response_data: responseData,
      request_payload: payload
    });

    if (dbError) {
      console.error('Error saving to database:', dbError);
      // Continua mesmo com erro no banco
    }

    return new Response(
      JSON.stringify({
        success,
        statusCode,
        urlsCount: validUrls.length,
        message: success 
          ? `✅ ${validUrls.length} URL(s) submetidas com sucesso ao IndexNow! As URLs serão compartilhadas automaticamente com Bing, Yandex, Naver, Seznam, Amazon e Yep.`
          : `❌ Erro ao submeter URLs (Status ${statusCode}). ${responseData || ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('IndexNow submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getAccessToken, validateServiceAccountJSON } from "../_shared/gsc-jwt-auth.ts";
import { detectCorrectPropertyUrl, comparePropertyUrl } from "../_shared/gsc-property-detector.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 GSC Test & Detect - Request received');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { service_account_json, configured_property_url, site_url } = await req.json();

    console.log('📋 Testing GSC integration...');
    console.log('Configured URL:', configured_property_url);
    console.log('Site URL:', site_url);

    const results = {
      authentication: { valid: false, error: null as string | null },
      available_properties: [] as string[],
      property_detection: {
        configured_url: configured_property_url || null,
        url_matches: false,
        suggested_url: null as string | null,
        variations_tested: [] as string[],
      },
      apis: {
        search_console: { active: false, error: null as string | null },
        indexing: { active: false, error: null as string | null },
      },
      overall_status: 'error' as 'healthy' | 'warning' | 'error',
      suggestions: [] as string[],
    };

    // 1. Validate Service Account JSON
    console.log('1️⃣ Validating Service Account JSON...');
    const validation = validateServiceAccountJSON(service_account_json);
    if (!validation.valid) {
      results.authentication.error = validation.error || 'Invalid JSON';
      results.suggestions.push('❌ JSON da Service Account está inválido');
      results.suggestions.push(`📝 Erro: ${validation.error}`);
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Test authentication (get access token)
    console.log('2️⃣ Testing authentication...');
    let accessToken: string;
    try {
      const tokenData = await getAccessToken(service_account_json);
      accessToken = tokenData.access_token;
      results.authentication.valid = true;
      console.log('✅ Authentication successful');
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.authentication.error = errorMessage;
      results.suggestions.push('❌ Falha na autenticação com Google');
      results.suggestions.push('🔑 Verifique se o JSON da Service Account está correto');
      results.suggestions.push('⏱️ Token JWT pode ter expirado - tente gerar um novo JSON');
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. List all available GSC properties
    console.log('3️⃣ Listing all available GSC properties...');
    try {
      const gscResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (gscResponse.ok) {
        const data = await gscResponse.json();
        const properties = data.siteEntry || [];
        results.available_properties = properties.map((p: any) => p.siteUrl);
        results.apis.search_console.active = true;
        console.log(`✅ Found ${results.available_properties.length} properties:`, results.available_properties);

        if (results.available_properties.length === 0) {
          results.suggestions.push('⚠️ Service Account não tem acesso a nenhuma propriedade no GSC');
          results.suggestions.push(`📧 Adicione ${service_account_json.client_email} como Proprietário no Google Search Console`);
          results.suggestions.push('⏱️ Aguarde 2-3 minutos após adicionar para propagação');
        }
      } else {
        const errorData = await gscResponse.json();
        results.apis.search_console.error = errorData.error?.message || 'API not accessible';
        console.log('❌ Search Console API error:', results.apis.search_console.error);
        results.suggestions.push('❌ Search Console API não está acessível');
        results.suggestions.push('🔗 Verifique se a API está habilitada no Google Cloud Console');
      }
    } catch (error) {
      results.apis.search_console.error = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Search Console API exception:', results.apis.search_console.error);
    }

    // 4. Test Web Search Indexing API
    console.log('4️⃣ Testing Web Search Indexing API...');
    try {
      const testUrl = configured_property_url || site_url || 'https://example.com';
      const indexingResponse = await fetch(
        `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(testUrl)}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (indexingResponse.ok || indexingResponse.status === 404) {
        // 404 is OK - means API is enabled but URL not found
        results.apis.indexing.active = true;
        console.log('✅ Web Search Indexing API: Active');
      } else {
        const errorData = await indexingResponse.json();
        if (errorData.error?.message?.includes('API has not been used') || errorData.error?.code === 403) {
          results.apis.indexing.error = 'API não habilitada no projeto Google Cloud';
          results.suggestions.push('❌ Web Search Indexing API não está habilitada');
          results.suggestions.push('🔗 Habilite em: https://console.cloud.google.com/apis/library/indexing.googleapis.com');
        } else {
          results.apis.indexing.error = errorData.error?.message || 'API not accessible';
        }
        console.log('❌ Web Search Indexing API error:', results.apis.indexing.error);
      }
    } catch (error) {
      results.apis.indexing.error = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Web Search Indexing API exception:', results.apis.indexing.error);
    }

    // 5. Detect correct property URL
    if (results.available_properties.length > 0 && site_url) {
      console.log('5️⃣ Detecting correct property URL...');
      
      try {
        const detectedUrl = await detectCorrectPropertyUrl(accessToken, site_url);
        if (detectedUrl) {
          results.property_detection.suggested_url = detectedUrl;
          console.log('✅ Detected URL:', detectedUrl);
        }

        // Compare configured URL with available properties
        if (configured_property_url) {
          const comparison = await comparePropertyUrl(accessToken, configured_property_url, site_url);
          results.property_detection.url_matches = comparison.url_matches;
          results.property_detection.variations_tested = comparison.available_properties;

          if (!comparison.url_matches && comparison.suggested_url) {
            results.overall_status = 'warning';
            results.suggestions.push('⚠️ URL configurada não corresponde às propriedades disponíveis');
            results.suggestions.push(`📝 URL atual: ${configured_property_url}`);
            results.suggestions.push(`✅ URL sugerida: ${comparison.suggested_url}`);
          }
        }
      } catch (error) {
        console.error('❌ Property detection error:', error);
      }
    }

    // 6. Determine overall status
    const allHealthy = results.authentication.valid && 
                      results.apis.search_console.active && 
                      results.apis.indexing.active &&
                      results.available_properties.length > 0;
    
    const someHealthy = results.authentication.valid && 
                       (results.apis.search_console.active || results.apis.indexing.active);

    if (allHealthy && (!configured_property_url || results.property_detection.url_matches)) {
      results.overall_status = 'healthy';
      results.suggestions.push('✅ Integração totalmente funcional');
    } else if (allHealthy && !results.property_detection.url_matches) {
      results.overall_status = 'warning';
    } else if (someHealthy) {
      results.overall_status = 'warning';
    } else {
      results.overall_status = 'error';
    }

    console.log('📊 Test complete. Overall status:', results.overall_status);
    console.log('💡 Suggestions:', results.suggestions);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gsc-test-and-detect:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

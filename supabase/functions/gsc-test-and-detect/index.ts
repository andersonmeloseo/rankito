import { createClient } from 'npm:@supabase/supabase-js@2';
import { getAccessToken, validateServiceAccountJSON } from "../_shared/gsc-jwt-auth.ts";
import { detectCorrectPropertyUrl, comparePropertyUrl } from "../_shared/gsc-property-detector.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    // 2. Test authentication
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
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. List GSC properties
    console.log('3️⃣ Listing GSC properties...');
    try {
      const gscResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (gscResponse.ok) {
        const data = await gscResponse.json();
        results.available_properties = data.siteEntry?.map((s: any) => s.siteUrl) || [];
        results.apis.search_console.active = true;
        console.log(`✅ Found ${results.available_properties.length} properties`);
      } else {
        const errorText = await gscResponse.text();
        results.apis.search_console.error = `${gscResponse.status}: ${errorText}`;
        results.suggestions.push('❌ Search Console API não respondeu');
        results.suggestions.push('🔧 Ative a Search Console API no Google Cloud Console');
      }
    } catch (error) {
      console.error('❌ Failed to list properties:', error);
      results.apis.search_console.error = error instanceof Error ? error.message : 'Unknown error';
      results.suggestions.push('❌ Erro ao listar propriedades GSC');
    }

    // 4. Test Indexing API (opcional)
    console.log('4️⃣ Testing Web Search Indexing API...');
    try {
      const indexingResponse = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: site_url,
          type: 'URL_UPDATED',
        }),
      });

      if (indexingResponse.ok) {
        results.apis.indexing.active = true;
        console.log('✅ Indexing API active');
      } else {
        results.apis.indexing.error = `${indexingResponse.status}`;
        results.suggestions.push('⚠️ Web Search Indexing API não ativa (opcional)');
      }
    } catch (error) {
      results.apis.indexing.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 5. Auto-detect property
    console.log('5️⃣ Auto-detecting property...');
    if (results.available_properties.length > 0) {
      try {
        const comparisonResult = await comparePropertyUrl(
          accessToken,
          configured_property_url,
          site_url
        );

        results.property_detection = {
          configured_url: comparisonResult.configured_url,
          url_matches: comparisonResult.url_matches,
          suggested_url: comparisonResult.suggested_url,
          variations_tested: comparisonResult.available_properties,
        };

        if (comparisonResult.suggested_url) {
          console.log('✅ Property detected:', comparisonResult.suggested_url);
          results.suggestions.push(`✅ Propriedade detectada: ${comparisonResult.suggested_url}`);
        } else if (results.available_properties.length === 1) {
          results.property_detection.suggested_url = results.available_properties[0];
        }
      } catch (error) {
        console.error('❌ Property detection failed:', error);
      }
    }

    // 6. Determine health
    console.log('6️⃣ Determining health status...');
    if (results.authentication.valid && results.apis.search_console.active && results.available_properties.length > 0) {
      results.overall_status = 'healthy';
      console.log('✅ Integration healthy');
    } else if (results.authentication.valid && results.apis.search_console.active) {
      results.overall_status = 'warning';
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

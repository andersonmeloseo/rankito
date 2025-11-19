import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  validateServiceAccountJSON, 
  getAccessToken, 
  fetchGSCProperties 
} from "../_shared/gsc-jwt-auth.ts";
import { detectCorrectPropertyUrl } from "../_shared/gsc-property-detector.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚨 START gsc-test-and-detect - FUNÇÃO INVOCADA');
  
  if (req.method === 'OPTIONS') {
    console.log('⚙️ OPTIONS request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Parsing request body...');
    let body;
    try {
      body = await req.json();
      console.log('📩 BODY RECEIVED:', JSON.stringify({
        hasServiceAccount: !!body.service_account_json,
        configuredUrl: body.configured_property_url,
        siteUrl: body.site_url
      }));
    } catch (jsonError: any) {
      console.error('❌ JSON PARSE ERROR:', jsonError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'JSON inválido na requisição',
          results: { overall_status: 'error' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { service_account_json, configured_property_url, site_url } = body;

    console.log('🔍 Testing GSC Service Account...');
    console.log('📍 Site URL:', site_url);

    // Fase 1: Validar JSON
    console.log('1️⃣ Validating Service Account JSON...');
    const validation = validateServiceAccountJSON(service_account_json);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error,
          results: {
            authentication: { valid: false, error: validation.error },
            overall_status: 'error'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const credentials = validation.credentials!;
    console.log('✅ JSON válido. Email:', credentials.client_email);

    // Fase 2: Testar Autenticação
    console.log('2️⃣ Testing authentication...');
    let accessToken: string;
    
    try {
      const tokenResult = await getAccessToken(credentials);
      accessToken = tokenResult.access_token;
      console.log('✅ Authentication successful');
    } catch (authError: any) {
      console.error('❌ Authentication failed:', authError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha na autenticação: ' + authError.message,
          results: {
            authentication: { valid: false, error: authError.message },
            overall_status: 'error'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Fase 3: Testar Search Console API
    console.log('3️⃣ Testing Search Console API...');
    let availableProperties: any[] = [];
    let searchConsoleActive = false;
    
    try {
      availableProperties = await fetchGSCProperties(accessToken);
      searchConsoleActive = true;
      console.log('✅ Search Console API active. Properties found:', availableProperties.length);
      console.log('📋 Available properties:', availableProperties.map(p => p.siteUrl));
    } catch (gscError: any) {
      console.error('❌ Search Console API failed:', gscError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Search Console API não acessível: ' + gscError.message,
          results: {
            authentication: { valid: true },
            search_console_api: { active: false, error: gscError.message },
            overall_status: 'error'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Fase 4: Testar Web Search Indexing API (opcional)
    console.log('4️⃣ Testing Web Search Indexing API...');
    let indexingApiActive = false;
    let indexingApiError: string | null = null;
    
    try {
      const testResponse = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: site_url,
          type: 'URL_UPDATED'
        })
      });

      // 200 ou 400 = API habilitada (400 pode ser URL inválida, mas API responde)
      if (testResponse.ok || testResponse.status === 400) {
        indexingApiActive = true;
        console.log('✅ Web Search Indexing API active');
      } else if (testResponse.status === 403) {
        indexingApiError = 'API não habilitada no Google Cloud Console';
        console.log('⚠️ Web Search Indexing API not enabled (não crítico)');
      }
    } catch (indexingError: any) {
      indexingApiError = indexingError.message;
      console.log('⚠️ Indexing API test failed (não crítico):', indexingError.message);
    }

    // Fase 5: Detecção Inteligente de Propriedade
    console.log('5️⃣ Detecting correct GSC property...');
    let suggestedUrl: string | null = null;
    let matchConfidence: 'high' | 'medium' | 'low' = 'low';
    
    try {
      suggestedUrl = await detectCorrectPropertyUrl(accessToken, site_url);
      
      if (suggestedUrl) {
        // Determinar confiança baseado em match exato
        const normalizedSiteUrl = site_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const normalizedSuggested = suggestedUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        if (normalizedSiteUrl === normalizedSuggested) {
          matchConfidence = 'high';
        } else if (normalizedSuggested.includes(normalizedSiteUrl) || normalizedSiteUrl.includes(normalizedSuggested)) {
          matchConfidence = 'medium';
        }
        
        console.log('✅ Property detected:', suggestedUrl, `(confidence: ${matchConfidence})`);
      } else {
        console.log('⚠️ No matching property found');
      }
    } catch (detectionError: any) {
      console.error('⚠️ Property detection failed:', detectionError.message);
      // Não é crítico - continuar
    }

    // Fase 6: Determinar Status Geral
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (!searchConsoleActive) {
      overallStatus = 'error';
    } else if (!indexingApiActive) {
      overallStatus = 'warning'; // API de indexação opcional
    }

    console.log('🏁 Test completed. Overall status:', overallStatus);

    // Retornar resultados estruturados
    return new Response(
      JSON.stringify({
        success: true,
        results: {
          authentication: { 
            valid: true,
            client_email: credentials.client_email 
          },
          search_console_api: { 
            active: searchConsoleActive,
            properties_count: availableProperties.length
          },
          indexing_api: { 
            active: indexingApiActive,
            error: indexingApiError,
            note: 'Opcional - não bloqueia integração'
          },
          available_properties: availableProperties.map(p => p.siteUrl),
          property_detection: {
            suggested_url: suggestedUrl,
            match_confidence: matchConfidence,
            configured_url: configured_property_url
          },
          overall_status: overallStatus
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    console.error('❌ Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido',
        results: {
          overall_status: 'error',
          error_details: error.stack
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

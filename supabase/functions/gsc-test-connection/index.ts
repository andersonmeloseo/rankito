import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    const { service_account_json, property_url, site_url } = await req.json();

    console.log('🧪 Testing GSC connection...');

    // 1. Validar JSON
    const validation = validateServiceAccountJSON(service_account_json);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'JSON inválido',
          message: validation.error,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Testar autenticação (obter access token)
    console.log('🔐 Testing authentication...');
    let accessToken: string;
    try {
      const tokenData = await getAccessToken(service_account_json);
      accessToken = tokenData.access_token;
      console.log('✅ Authentication successful');
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha na autenticação',
          message: 'Não foi possível obter access token. Verifique o JSON da Service Account.',
          details: errorMessage,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Detectar propriedades disponíveis
    console.log('🔍 Detecting available properties...');
    const detectedUrl = await detectCorrectPropertyUrl(accessToken, site_url);
    
    // 4. Comparar URL configurada (se fornecida) com disponíveis
    const comparison = await comparePropertyUrl(accessToken, property_url, site_url);

    // 5. Determinar status do teste
    let status: 'success' | 'warning' | 'error' = 'success';
    let message = 'Conexão testada com sucesso!';
    let suggestions: string[] = [];

    if (comparison.available_properties.length === 0) {
      status = 'error';
      message = 'Service Account não tem acesso a nenhuma propriedade no GSC';
      suggestions = [
        `Adicione o email ${service_account_json.client_email} como Proprietário no Google Search Console`,
        'Aguarde 2-3 minutos após adicionar para propagação',
      ];
    } else if (property_url && !comparison.url_matches) {
      status = 'warning';
      message = 'URL configurada não corresponde às propriedades disponíveis';
      suggestions = [
        `URL configurada: ${property_url}`,
        `URLs disponíveis: ${comparison.available_properties.join(', ')}`,
      ];
      if (comparison.suggested_url) {
        suggestions.push(`💡 Sugestão: Use "${comparison.suggested_url}"`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status,
        message,
        suggestions,
        data: {
          authenticated: true,
          client_email: service_account_json.client_email,
          available_properties: comparison.available_properties,
          configured_url: comparison.configured_url,
          url_matches: comparison.url_matches,
          suggested_url: comparison.suggested_url,
          detected_url: detectedUrl,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error testing connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao testar conexão',
        message: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

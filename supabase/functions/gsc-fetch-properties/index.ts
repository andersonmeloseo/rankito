import { createClient } from 'npm:@supabase/supabase-js@2';
import { getAccessToken } from "../_shared/gsc-jwt-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GSCProperty {
  siteUrl: string;
  permissionLevel: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_id } = await req.json();

    if (!integration_id) {
      return new Response(
        JSON.stringify({ error: 'integration_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Fetching GSC properties for integration:', integration_id);

    // Buscar integração
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: integration, error: integrationError } = await supabase
      .from('google_search_console_integrations')
      .select('service_account_json')
      .eq('id', integration_id)
      .maybeSingle();

    if (integrationError || !integration) {
      console.error('❌ Integration not found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integração não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.service_account_json) {
      return new Response(
        JSON.stringify({ error: 'Service Account JSON não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter access token
    const tokenData = await getAccessToken(integration.service_account_json);
    
    // Buscar propriedades disponíveis no GSC
    console.log('📋 Fetching available GSC properties...');
    const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Failed to fetch properties:', errorData);
      return new Response(
        JSON.stringify({
          error: 'Falha ao buscar propriedades do GSC',
          details: errorData,
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const properties: GSCProperty[] = data.siteEntry || [];

    console.log(`✅ Found ${properties.length} GSC properties:`, properties.map(p => p.siteUrl));

    return new Response(
      JSON.stringify({
        success: true,
        properties: properties,
        count: properties.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error fetching GSC properties:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Erro ao buscar propriedades GSC',
        message: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

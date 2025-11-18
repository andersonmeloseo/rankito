import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-token',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API token from header or query param
    const apiToken = req.headers.get('x-api-token') || new URL(req.url).searchParams.get('token');
    
    if (!apiToken) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token não fornecido',
          message: 'Informe o token no header x-api-token ou no query param ?token=' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API token
    const { data: source, error } = await supabase
      .from('external_lead_sources')
      .select('*')
      .eq('api_token', apiToken)
      .single();

    if (error || !source) {
      console.error('Token not found:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token inválido',
          message: 'O token fornecido não foi encontrado ou está inválido'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!source.is_active) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Integração desativada',
          message: `A integração "${source.source_name}" existe mas está desativada. Ative-a no CRM para receber leads.`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get stats
    const stats = source.stats || { total_leads: 0, last_lead_at: null };

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `✅ Conexão ativa! A integração "${source.source_name}" está funcionando corretamente.`,
        integration: {
          name: source.source_name,
          type: source.source_type,
          site_url: source.site_url,
          is_active: source.is_active,
          stats: {
            total_leads: stats.total_leads || 0,
            last_lead_at: stats.last_lead_at
          }
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Test connection error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
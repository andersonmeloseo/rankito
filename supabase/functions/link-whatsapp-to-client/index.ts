import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API token from headers
    const apiToken = req.headers.get('x-api-token');
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'Token da API não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token
    const { data: source, error: sourceError } = await supabase
      .from('external_lead_sources')
      .select('user_id')
      .eq('api_token', apiToken)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { deal_id, client_id } = await req.json();

    if (!deal_id || !client_id) {
      return new Response(
        JSON.stringify({ error: 'deal_id e client_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client info
    const { data: client } = await supabase
      .from('rank_rent_clients')
      .select('name')
      .eq('id', client_id)
      .eq('user_id', source.user_id)
      .single();

    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update deal
    const { error: updateError } = await supabase
      .from('crm_deals')
      .update({ 
        client_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deal_id)
      .eq('user_id', source.user_id);

    if (updateError) {
      throw updateError;
    }

    // Create activity
    await supabase.from('crm_activities').insert({
      deal_id,
      user_id: source.user_id,
      activity_type: 'note',
      title: 'Deal vinculado a cliente',
      description: `Deal vinculado ao cliente: ${client.name}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deal vinculado ao cliente ${client.name} com sucesso!`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Link Client] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

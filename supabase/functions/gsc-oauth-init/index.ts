import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 GSC OAuth Init - Request received');

    // Get JWT token from headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { integration_id, site_id } = await req.json();

    if (!integration_id || !site_id) {
      throw new Error('integration_id e site_id são obrigatórios');
    }

    console.log('📋 Parameters:', { integration_id, site_id });

    // Buscar credenciais da integração
    const { data: integration, error: integrationError } = await supabase
      .from('google_search_console_integrations')
      .select('google_client_id, google_client_secret, user_id')
      .eq('id', integration_id)
      .eq('site_id', site_id)
      .single();

    if (integrationError || !integration) {
      console.error('❌ Integration not found:', integrationError);
      throw new Error('Integração não encontrada');
    }

    console.log('✅ Integration credentials found');

    // Gerar state único para CSRF protection
    const state = crypto.randomUUID();
    console.log('🔑 State generated:', state.substring(0, 10) + '...');

    // Salvar state na tabela oauth_states com TTL de 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert([{
        state,
        integration_id,
        site_id,
        user_id: integration.user_id,
        expires_at: expiresAt.toISOString(),
      }]);

    if (stateError) {
      console.error('❌ Failed to save state:', stateError);
      throw new Error('Falha ao salvar state');
    }

    console.log('💾 State saved to database');

    // Construir URL de autorização do Google
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gsc-oauth-callback`;
    const scopes = [
      'email',
      'profile',
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/indexing',
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', integration.google_client_id);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    console.log('🌐 Authorization URL constructed');

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in gsc-oauth-init:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

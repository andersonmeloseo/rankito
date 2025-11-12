import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { exchangeCodeForTokens, fetchGSCProperties } from '../_shared/gsc-helpers.ts';

serve(async (req) => {
  try {
    console.log('🔄 GSC OAuth Callback - Request received');

    // Extrair code e state da URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('📋 Parameters:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
    });

    // Verificar se houve erro do Google
    if (error) {
      console.error('❌ Google OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/dashboard?gsc_error=${error}`,
        },
      });
    }

    // Validar parâmetros
    if (!code || !state) {
      console.error('❌ Missing code or state');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/dashboard?gsc_error=missing_params`,
        },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar state token
    console.log('🔍 Validating state token...');
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();

    if (stateError || !oauthState) {
      console.error('❌ Invalid or expired state:', stateError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/dashboard?gsc_error=invalid_state`,
        },
      });
    }

    // Verificar expiração
    const now = new Date();
    const expiresAt = new Date(oauthState.expires_at);
    if (now >= expiresAt) {
      console.error('❌ State expired');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/dashboard?gsc_error=state_expired`,
        },
      });
    }

    console.log('✅ State validated successfully');

    // Buscar credenciais da integração
    const { data: integration, error: integrationError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('id', oauthState.integration_id)
      .single();

    if (integrationError || !integration) {
      console.error('❌ Integration not found:', integrationError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/dashboard?gsc_error=integration_not_found`,
        },
      });
    }

    console.log('✅ Integration found');

    // Trocar code por tokens
    const redirectUri = `${supabaseUrl}/functions/v1/gsc-oauth-callback`;
    
    const tokens = await exchangeCodeForTokens(
      code,
      integration.google_client_id,
      integration.google_client_secret,
      redirectUri
    );

    console.log('✅ Tokens obtained, expires in:', tokens.expires_in, 'seconds');

    // Buscar propriedades GSC disponíveis
    let gscPropertyUrl = null;
    let gscPermissionLevel = null;

    try {
      const properties = await fetchGSCProperties(tokens.access_token);
      
      if (properties.length > 0) {
        // Pegar a primeira propriedade (pode ser melhorado para o usuário escolher)
        gscPropertyUrl = properties[0].siteUrl;
        gscPermissionLevel = properties[0].permissionLevel;
        console.log('✅ GSC Property found:', gscPropertyUrl);
      } else {
        console.warn('⚠️ No GSC properties found for this user');
      }
    } catch (propError) {
      console.error('⚠️ Failed to fetch GSC properties, but continuing:', propError);
      // Continuar mesmo sem propriedades - usuário pode configurar depois
    }

    // Atualizar integração com tokens
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: updateError } = await supabase
      .from('google_search_console_integrations')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || integration.refresh_token, // Manter refresh token anterior se novo não vier
        token_expires_at: tokenExpiresAt.toISOString(),
        gsc_property_url: gscPropertyUrl,
        gsc_permission_level: gscPermissionLevel,
        is_active: true,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', oauthState.integration_id);

    if (updateError) {
      console.error('❌ Failed to update integration:', updateError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/dashboard?gsc_error=update_failed`,
        },
      });
    }

    console.log('✅ Integration updated successfully');

    // Deletar state usado
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);

    console.log('🗑️ State deleted');

    // Redirecionar para dashboard com sucesso
    const dashboardUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/dashboard?gsc_success=true&integration_id=${oauthState.integration_id}`;
    
    console.log('✅ Redirecting to dashboard');

    return new Response(null, {
      status: 302,
      headers: {
        'Location': dashboardUrl,
      },
    });

  } catch (error) {
    console.error('❌ Error in gsc-oauth-callback:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/dashboard?gsc_error=unknown`,
      },
    });
  }
});

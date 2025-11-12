import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GSCTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GSCProperty {
  siteUrl: string;
  permissionLevel: string;
}

/**
 * Refresh access token usando refresh token
 */
async function refreshGSCToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<GSCTokenResponse> {
  console.log('🔄 Refreshing GSC token...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to refresh token:', error);
    throw new Error('Falha ao renovar token GSC');
  }

  const data = await response.json();
  console.log('✅ Token refreshed successfully');
  return data;
}

/**
 * Buscar integração e garantir que o token está válido
 */
export async function getIntegrationWithValidToken(integrationId: string) {
  console.log('🔍 Fetching integration:', integrationId);

  const { data: integration, error } = await supabase
    .from('google_search_console_integrations')
    .select('*')
    .eq('id', integrationId)
    .single();

  if (error || !integration) {
    console.error('❌ Integration not found:', error);
    throw new Error('Integração não encontrada');
  }

  // Verificar se token está expirado
  const now = new Date();
  const expiresAt = new Date(integration.token_expires_at);
  
  console.log('⏰ Token status:', {
    now: now.toISOString(),
    expires: expiresAt.toISOString(),
    isExpired: now >= expiresAt,
  });

  if (now >= expiresAt) {
    console.log('🔄 Token expired, refreshing...');
    
    // Refresh token
    const tokens = await refreshGSCToken(
      integration.google_client_id,
      integration.google_client_secret,
      integration.refresh_token
    );
    
    // Atualizar tokens no banco
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    
    const { error: updateError } = await supabase
      .from('google_search_console_integrations')
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId);

    if (updateError) {
      console.error('❌ Failed to update tokens:', updateError);
      throw new Error('Falha ao atualizar tokens');
    }

    console.log('✅ Tokens updated in database');
    return { ...integration, access_token: tokens.access_token };
  }

  console.log('✅ Token still valid');
  return integration;
}

/**
 * Buscar propriedades GSC disponíveis para o usuário
 */
export async function fetchGSCProperties(accessToken: string): Promise<GSCProperty[]> {
  console.log('🔍 Fetching GSC properties...');

  const response = await fetch(
    'https://www.googleapis.com/webmasters/v3/sites',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to fetch GSC properties:', error);
    throw new Error('Falha ao buscar propriedades GSC');
  }

  const data = await response.json();
  const properties = data.siteEntry || [];
  
  console.log('✅ Found', properties.length, 'GSC properties');
  return properties;
}

/**
 * Trocar authorization code por tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GSCTokenResponse> {
  console.log('🔄 Exchanging code for tokens...');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to exchange code:', error);
    throw new Error('Falha ao trocar código por tokens');
  }

  const data = await response.json();
  console.log('✅ Tokens obtained successfully, expires in:', data.expires_in, 'seconds');
  return data;
}

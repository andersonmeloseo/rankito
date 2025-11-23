import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface GBPIntegrationWithToken {
  id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  location_name: string | null;
  business_name: string | null;
  site_id: string;
  user_id: string;
}

/**
 * Refresh OAuth2 access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  console.log('🔄 Refreshing OAuth2 access token...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Token refresh failed:', error);
    throw new Error(`Failed to refresh access token: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Access token refreshed successfully');
  
  return {
    access_token: data.access_token,
    expires_in: data.expires_in || 3600,
  };
}

/**
 * Get integration with valid access token (auto-refreshes if expired)
 */
export async function getIntegrationWithValidToken(integrationId: string): Promise<GBPIntegrationWithToken> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`📋 Fetching integration ${integrationId}...`);

  const { data: integration, error } = await supabase
    .from('google_business_profiles')
    .select('*')
    .eq('id', integrationId)
    .single();

  if (error || !integration) {
    throw new Error('Integration not found');
  }

  if (!integration.access_token || !integration.refresh_token) {
    throw new Error('Integration missing OAuth2 tokens');
  }

  // Check if token is expired or about to expire (5 min buffer)
  const expiresAt = new Date(integration.token_expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (expiresAt.getTime() - now.getTime() < bufferMs) {
    console.log('⏰ Token expired or expiring soon, refreshing...');
    
    try {
      const { access_token, expires_in } = await refreshAccessToken(integration.refresh_token);
      
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + expires_in);

      // Update token in database
      const { error: updateError } = await supabase
        .from('google_business_profiles')
        .update({
          access_token,
          token_expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', integrationId);

      if (updateError) {
        console.error('⚠️ Failed to update token in DB:', updateError);
      }

      integration.access_token = access_token;
      integration.token_expires_at = newExpiresAt.toISOString();
      
      console.log('✅ Token refreshed and updated in DB');
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);
      await markIntegrationUnhealthy(integrationId, 'Token refresh failed');
      throw refreshError;
    }
  }

  return integration as GBPIntegrationWithToken;
}

/**
 * Fetch Google Business Profile locations using OAuth2 access token
 */
export async function fetchGBPLocations(accessToken: string): Promise<any[]> {
  console.log('📍 Fetching GBP locations...');

  // First, get accounts
  const accountsResponse = await fetch(
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!accountsResponse.ok) {
    const error = await accountsResponse.text();
    console.error('❌ Failed to fetch accounts:', error);
    throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
  }

  const accountsData = await accountsResponse.json();
  const accounts = accountsData.accounts || [];

  if (accounts.length === 0) {
    console.log('⚠️ No GBP accounts found');
    return [];
  }

  console.log(`✅ Found ${accounts.length} account(s)`);

  // Fetch locations for first account
  const accountName = accounts[0].name;
  const locationsResponse = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!locationsResponse.ok) {
    const error = await locationsResponse.text();
    console.error('❌ Failed to fetch locations:', error);
    throw new Error(`Failed to fetch locations: ${locationsResponse.status}`);
  }

  const locationsData = await locationsResponse.json();
  const locations = locationsData.locations || [];

  console.log(`✅ Found ${locations.length} location(s)`);
  return locations;
}

/**
 * Mark integration as unhealthy
 */
export async function markIntegrationUnhealthy(integrationId: string, errorMessage: string): Promise<void> {
  console.log(`⚠️ Marking integration ${integrationId} as unhealthy`);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('google_business_profiles')
    .update({
      health_status: 'unhealthy',
      last_error: errorMessage,
      consecutive_failures: supabase.rpc('increment', { x: 1, field: 'consecutive_failures' }) as any,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);

  if (error) {
    console.error('Failed to mark integration unhealthy:', error);
  }
}

/**
 * Mark integration as healthy
 */
export async function markIntegrationHealthy(integrationId: string): Promise<void> {
  console.log(`✅ Marking integration ${integrationId} as healthy`);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('google_business_profiles')
    .update({
      health_status: 'healthy',
      last_error: null,
      consecutive_failures: 0,
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);

  if (error) {
    console.error('Failed to mark integration healthy:', error);
  }
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: any): boolean {
  const errorStr = error?.message?.toLowerCase() || '';
  return (
    errorStr.includes('unauthorized') ||
    errorStr.includes('invalid_grant') ||
    errorStr.includes('invalid_token') ||
    errorStr.includes('token') ||
    errorStr.includes('401')
  );
}

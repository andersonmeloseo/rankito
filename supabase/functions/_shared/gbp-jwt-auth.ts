import { importPKCS8, SignJWT } from "https://esm.sh/jose@v5.9.6";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

interface GBPAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Creates a signed JWT with the Service Account private key
 */
async function createJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const privateKey = await importPKCS8(credentials.private_key, 'RS256');
  
  const jwt = await new SignJWT({
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    scope: 'https://www.googleapis.com/auth/business.manage',
    iat: now,
    exp: now + 3600, // 1 hour
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);
  
  return jwt;
}

/**
 * Exchanges JWT for Google access_token
 */
async function getAccessToken(credentials: ServiceAccountCredentials): Promise<GBPAccessToken> {
  const jwt = await createJWT(credentials);
  
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }
  
  return await response.json();
}

/**
 * Fetches integration and generates access_token via JWT
 */
async function getIntegrationWithValidToken(
  integrationId: string
): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: integration, error } = await supabase
    .from('google_business_profiles')
    .select('*')
    .eq('id', integrationId)
    .maybeSingle();
  
  if (error || !integration) {
    throw new Error('Integration not found');
  }
  
  if (!integration.service_account_json) {
    throw new Error('Service Account JSON not configured');
  }
  
  const credentials: ServiceAccountCredentials = integration.service_account_json;
  const tokenData = await getAccessToken(credentials);
  
  return {
    ...integration,
    access_token: tokenData.access_token,
  };
}

/**
 * Validates Service Account JSON structure
 */
function validateServiceAccountJSON(json: any): {
  valid: boolean;
  error?: string;
  credentials?: ServiceAccountCredentials;
} {
  if (!json || typeof json !== 'object') {
    return { valid: false, error: 'JSON inválido' };
  }
  
  if (json.type !== 'service_account') {
    return { valid: false, error: 'Tipo deve ser "service_account"' };
  }
  
  const requiredFields = [
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id',
    'auth_uri',
    'token_uri',
  ];
  
  for (const field of requiredFields) {
    if (!json[field]) {
      return { valid: false, error: `Campo obrigatório ausente: ${field}` };
    }
  }
  
  return { valid: true, credentials: json as ServiceAccountCredentials };
}

/**
 * Fetches available GBP locations using Service Account
 */
async function fetchGBPLocations(accessToken: string): Promise<any[]> {
  const accountsResponse = await fetch(
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!accountsResponse.ok) {
    const error = await accountsResponse.text();
    throw new Error(`Failed to fetch GBP accounts: ${error}`);
  }
  
  const accountsData = await accountsResponse.json();
  const accounts = accountsData.accounts || [];
  
  if (accounts.length === 0) {
    return [];
  }
  
  // Get locations for first account
  const accountName = accounts[0].name;
  const locationsResponse = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!locationsResponse.ok) {
    const error = await locationsResponse.text();
    throw new Error(`Failed to fetch locations: ${error}`);
  }
  
  const locationsData = await locationsResponse.json();
  return locationsData.locations || [];
}

/**
 * Marks integration as unhealthy with error tracking
 */
async function markIntegrationUnhealthy(
  integrationId: string,
  errorMessage: string
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  await supabase
    .from('google_business_profiles')
    .update({
      health_status: 'error',
      last_error: errorMessage,
      consecutive_failures: supabase.rpc('increment', { x: 1, field_name: 'consecutive_failures' }),
    })
    .eq('id', integrationId);
    
  console.log(`⚠️ Integration ${integrationId} marked as unhealthy: ${errorMessage}`);
}

/**
 * Marks integration as healthy
 */
async function markIntegrationHealthy(integrationId: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  await supabase
    .from('google_business_profiles')
    .update({
      health_status: 'healthy',
      last_error: null,
      consecutive_failures: 0,
    })
    .eq('id', integrationId);
    
  console.log(`✅ Integration ${integrationId} marked as healthy`);
}

/**
 * Checks if error is authentication-related
 */
function isAuthError(error: any): boolean {
  const errorStr = JSON.stringify(error).toLowerCase();
  return (
    errorStr.includes('authentication') ||
    errorStr.includes('unauthorized') ||
    errorStr.includes('invalid_grant') ||
    errorStr.includes('invalid credentials') ||
    errorStr.includes('permission denied')
  );
}

export {
  getIntegrationWithValidToken,
  getAccessToken,
  validateServiceAccountJSON,
  fetchGBPLocations,
  markIntegrationUnhealthy,
  markIntegrationHealthy,
  isAuthError,
  type ServiceAccountCredentials,
  type GBPAccessToken,
};

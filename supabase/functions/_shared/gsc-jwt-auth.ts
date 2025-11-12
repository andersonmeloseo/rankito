import { importPKCS8, SignJWT } from "https://deno.land/x/jose@v5.9.6/index.ts";
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

interface GSCAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Cria um JWT assinado com a private key da Service Account
 */
async function createJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // Importar private key
  const privateKey = await importPKCS8(credentials.private_key, 'RS256');
  
  // Criar JWT
  const jwt = await new SignJWT({
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    scope: 'https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/indexing',
    iat: now,
    exp: now + 3600, // 1 hora
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);
  
  return jwt;
}

/**
 * Troca JWT por access_token do Google
 */
async function getAccessToken(credentials: ServiceAccountCredentials): Promise<GSCAccessToken> {
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
 * Busca integração e gera access_token via JWT
 */
async function getIntegrationWithValidToken(
  integrationId: string
): Promise<any> {
  // Criar cliente Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Buscar integração
  const { data: integration, error } = await supabase
    .from('google_search_console_integrations')
    .select('*')
    .eq('id', integrationId)
    .maybeSingle();
  
  if (error || !integration) {
    throw new Error('Integration not found');
  }
  
  if (!integration.service_account_json) {
    throw new Error('Service Account JSON not configured');
  }
  
  // Gerar access token via JWT
  const credentials: ServiceAccountCredentials = integration.service_account_json;
  const tokenData = await getAccessToken(credentials);
  
  // Retornar objeto compatível com código antigo
  return {
    ...integration,
    access_token: tokenData.access_token,
  };
}

/**
 * Valida estrutura do JSON da Service Account
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
 * Busca propriedades GSC disponíveis usando Service Account
 */
async function fetchGSCProperties(accessToken: string): Promise<any[]> {
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
    throw new Error(`Failed to fetch GSC properties: ${error}`);
  }
  
  const data = await response.json();
  return data.siteEntry || [];
}

export {
  getIntegrationWithValidToken,
  getAccessToken,
  validateServiceAccountJSON,
  fetchGSCProperties,
  type ServiceAccountCredentials,
  type GSCAccessToken,
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { 
  validateServiceAccountJSON, 
  getAccessToken, 
  fetchGBPLocations 
} from '../_shared/gbp-jwt-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Validating GBP Service Account...');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { service_account_json } = await req.json();
    
    if (!service_account_json) {
      throw new Error('Missing service_account_json');
    }

    console.log('📋 Validating JSON structure...');
    
    // Validate JSON structure
    const validation = validateServiceAccountJSON(service_account_json);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid Service Account JSON');
    }

    console.log('✅ JSON structure valid');
    console.log('🔐 Generating access token...');

    // Generate access token
    const tokenData = await getAccessToken(validation.credentials!);
    
    console.log('✅ Access token generated');
    console.log('📍 Fetching GBP locations...');

    // Fetch locations
    const locations = await fetchGBPLocations(tokenData.access_token);
    
    console.log(`✅ Found ${locations.length} location(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        locations,
        email: validation.credentials!.client_email,
        project: validation.credentials!.project_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gbp-validate-service-account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

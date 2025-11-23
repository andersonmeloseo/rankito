import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 Generating OAuth2 authorization URL...');

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
    const { } = await req.json();
    
    // No longer need site_id - GBP profiles are global now

    // Get OAuth2 credentials
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gbp-oauth-callback`;
    
    console.log('🔗 Redirect URI:', redirectUri);

    if (!clientId) {
      throw new Error('Google OAuth2 not configured. Contact support.');
    }

    // Required scopes for GBP
    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/businessprofileperformance',
    ];

    // Generate state parameter (includes user_id for callback)
    const state = JSON.stringify({
      user_id: user.id,
      timestamp: Date.now(),
    });

    // Encode state as base64
    const stateEncoded = btoa(state);

    // Build authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', stateEncoded);
    authUrl.searchParams.set('access_type', 'offline'); // Get refresh_token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh_token

    console.log('✅ Authorization URL generated');

    return new Response(
      JSON.stringify({ 
        success: true, 
        authorization_url: authUrl.toString(),
        state: stateEncoded,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gbp-oauth-authorize:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

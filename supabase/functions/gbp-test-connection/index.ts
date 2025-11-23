import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<string> {
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
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Testing GBP connection...');

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
    const { profile_id } = await req.json();
    
    if (!profile_id) {
      throw new Error('Missing profile_id');
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile query error:', profileError);
      throw new Error('Profile not found');
    }

    // Check ownership (directly from profile user_id)
    if (profile.user_id !== user.id) {
      throw new Error('Unauthorized - profile does not belong to user');
    }

    // Check if token needs refresh
    const tokenExpiresAt = new Date(profile.token_expires_at);
    let accessToken = profile.access_token;

    if (tokenExpiresAt <= new Date()) {
      console.log('🔄 Refreshing access token...');
      accessToken = await refreshAccessToken(profile.refresh_token);
      
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + 1);

      await supabase
        .from('google_business_profiles')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', profile_id);
    }

    // Test API call
    const testResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    if (!testResponse.ok) {
      throw new Error(`API test failed: ${testResponse.status}`);
    }

    console.log('✅ Connection test successful');

    // Update profile
    await supabase
      .from('google_business_profiles')
      .update({
        health_status: 'healthy',
        last_sync_at: new Date().toISOString(),
        last_error: null,
        consecutive_failures: 0,
      })
      .eq('id', profile_id);

    return new Response(
      JSON.stringify({ success: true, status: 'healthy' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gbp-test-connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update profile with error
    if (error instanceof Error && error.message !== 'Unauthorized') {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        
        const { profile_id } = await new Request(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        }).json();

        await supabase
          .from('google_business_profiles')
          .update({
            health_status: 'error',
            last_error: errorMessage,
          })
          .eq('id', profile_id);
      } catch (e) {
        console.error('Failed to update profile error status:', e);
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

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
    console.log('🔄 Processing GBP OAuth callback...');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('❌ OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${Deno.env.get('VITE_APP_URL') || 'https://app.rankitocrm.com'}/dashboard?gbp_error=${error}`,
        },
      });
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate state token
    const { data: oauthState, error: stateError } = await supabase
      .from('gbp_oauth_states')
      .select('*')
      .eq('state_token', state)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (stateError || !oauthState) {
      throw new Error('Invalid or expired state token');
    }

    console.log(`📋 OAuth state validated for user: ${oauthState.user_id}`);

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
        redirect_uri: `${supabaseUrl}/functions/v1/gbp-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Tokens received successfully');

    // Get user info to extract email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    const googleEmail = userInfo.email;

    // Get Google Business Profile accounts
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      }
    );

    if (!accountsResponse.ok) {
      throw new Error('Failed to fetch GBP accounts');
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
      throw new Error('No Google Business Profile accounts found');
    }

    // Get first account and location
    const accountName = accounts[0].name;
    const locationsResponse = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
      {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      }
    );

    const locationsData = await locationsResponse.json();
    const locations = locationsData.locations || [];

    const location = locations[0] || null;
    const locationName = location?.name || null;
    const businessName = location?.title || null;
    const businessAddress = location?.storefrontAddress ? 
      `${location.storefrontAddress.addressLines?.join(', ')} - ${location.storefrontAddress.locality}` : null;
    const businessPhone = location?.phoneNumbers?.primaryPhone || null;
    const businessCategories = location?.categories?.primaryCategory ? 
      [location.categories.primaryCategory.displayName] : [];

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Insert GBP profile
    const { error: insertError } = await supabase
      .from('google_business_profiles')
      .insert({
        user_id: oauthState.user_id,
        site_id: oauthState.site_id,
        connection_name: oauthState.connection_name,
        google_email: googleEmail,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        location_name: locationName,
        business_name: businessName,
        business_address: businessAddress,
        business_phone: businessPhone,
        business_categories: businessCategories,
        is_active: true,
        health_status: 'healthy',
        last_sync_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('❌ Error inserting GBP profile:', insertError);
      throw insertError;
    }

    // Delete used OAuth state
    await supabase
      .from('gbp_oauth_states')
      .delete()
      .eq('state_token', state);

    console.log('✅ GBP profile created successfully');

    // Redirect to dashboard
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${Deno.env.get('VITE_APP_URL') || 'https://app.rankitocrm.com'}/dashboard/site/${oauthState.site_id}?tab=gbp&gbp_success=true`,
      },
    });

  } catch (error) {
    console.error('❌ Error in gbp-oauth-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${Deno.env.get('VITE_APP_URL') || 'https://app.rankitocrm.com'}/dashboard?gbp_error=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});

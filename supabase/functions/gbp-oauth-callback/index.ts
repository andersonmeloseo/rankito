import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { fetchGBPLocations } from '../_shared/gbp-oauth-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Processing OAuth2 callback...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { code, state, connection_name } = await req.json();
    
    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    // Decode state
    let stateData: { site_id: string; user_id: string; timestamp: number };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      throw new Error('Invalid state parameter');
    }

    // Validate timestamp (state should be < 10 minutes old)
    const now = Date.now();
    if (now - stateData.timestamp > 10 * 60 * 1000) {
      throw new Error('State expired. Please try again.');
    }

    console.log('✅ State validated');

    // Exchange authorization code for tokens
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gbp-oauth-callback`;
    
    console.log('🔗 Redirect URI:', redirectUri);

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth2 not configured. Contact support.');
    }

    console.log('🔐 Exchanging code for tokens...');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Token exchange failed:', error);
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.refresh_token) {
      throw new Error('No refresh_token received. User may have already authorized this app.');
    }

    console.log('✅ Tokens received');

    // Calculate token expiration
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Fetch GBP locations to get business info
    console.log('📍 Fetching GBP locations...');
    const locations = await fetchGBPLocations(tokenData.access_token);

    let businessName = null;
    let businessAddress = null;
    let businessPhone = null;
    let businessCategories = null;
    let locationName = null;
    let googleEmail = null;

    if (locations.length > 0) {
      const location = locations[0];
      businessName = location.title || location.name;
      locationName = location.name;
      
      if (location.storefrontAddress) {
        const addr = location.storefrontAddress;
        businessAddress = [
          addr.addressLines?.join(', '),
          addr.locality,
          addr.administrativeArea,
          addr.postalCode,
          addr.regionCode,
        ].filter(Boolean).join(', ');
      }
      
      businessPhone = location.phoneNumbers?.primaryPhone;
      businessCategories = location.categories?.primaryCategory?.displayName 
        ? [location.categories.primaryCategory.displayName]
        : null;
    }

    // Get user email from Google profile
    try {
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        googleEmail = profileData.email;
      }
    } catch (e) {
      console.log('⚠️ Could not fetch Google profile email');
    }

    // Insert integration into database
    console.log('💾 Saving integration to database...');

    const { data: integration, error: insertError } = await supabase
      .from('google_business_profiles')
      .insert({
        // site_id is now optional - GBP profiles are global
        user_id: stateData.user_id,
        connection_name: connection_name || 'Google Business Profile',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        business_name: businessName,
        business_address: businessAddress,
        business_phone: businessPhone,
        business_categories: businessCategories,
        location_name: locationName,
        google_email: googleEmail,
        health_status: 'healthy',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to save integration:', insertError);
      throw new Error('Failed to save integration');
    }

    console.log('✅ Integration saved successfully');

    // Redirect back to the frontend with success status
    const appUrl = Deno.env.get('VITE_APP_URL') || 'https://rankitocrm.lovable.app';
    const redirectUrl = `${appUrl}/oauth/gbp/callback?code=${code}&state=${state}`;

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('❌ Error in gbp-oauth-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Redirect back to the frontend with error status
    const appUrl = Deno.env.get('VITE_APP_URL') || 'https://rankitocrm.lovable.app';
    const redirectUrl = `${appUrl}/oauth/gbp/callback?error=${encodeURIComponent(errorMessage)}`;

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });
  }
});

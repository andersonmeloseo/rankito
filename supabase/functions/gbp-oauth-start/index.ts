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
    console.log('🚀 Starting GBP OAuth flow...');

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
    const { site_id, connection_name } = await req.json();
    
    if (!site_id || !connection_name) {
      throw new Error('Missing required fields: site_id, connection_name');
    }

    console.log(`📋 User: ${user.id}, Site: ${site_id}, Connection: ${connection_name}`);

    // Check if user owns the site
    const { data: site, error: siteError } = await supabase
      .from('rank_rent_sites')
      .select('owner_user_id')
      .eq('id', site_id)
      .single();

    if (siteError || !site || site.owner_user_id !== user.id) {
      throw new Error('Site not found or unauthorized');
    }

    // Check plan limits
    const { data: planData } = await supabase
      .from('user_subscriptions')
      .select(`
        plan_id,
        subscription_plans!inner(max_gbp_integrations)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planData) {
      const maxIntegrations = (planData as any).subscription_plans?.max_gbp_integrations;
      
      // Count current integrations
      const { count: currentCount } = await supabase
        .from('google_business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site_id);

      if (maxIntegrations !== null && currentCount && currentCount >= maxIntegrations) {
        throw new Error(`Limite de ${maxIntegrations} integrações GBP atingido. Faça upgrade do plano.`);
      }
    }

    // Generate unique state token
    const stateToken = crypto.randomUUID();

    // Save OAuth state
    const { error: stateError } = await supabase
      .from('gbp_oauth_states')
      .insert({
        user_id: user.id,
        site_id,
        state_token: stateToken,
        connection_name,
      });

    if (stateError) {
      console.error('❌ Error saving OAuth state:', stateError);
      throw stateError;
    }

    // Build Google OAuth2 authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', Deno.env.get('GOOGLE_CLIENT_ID') || '');
    authUrl.searchParams.set('redirect_uri', `${supabaseUrl}/functions/v1/gbp-oauth-callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/business.manage');
    authUrl.searchParams.set('state', stateToken);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    console.log('✅ OAuth URL generated successfully');

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        stateToken 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gbp-oauth-start:', error);
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

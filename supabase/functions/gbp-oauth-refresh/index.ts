import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { refreshAccessToken } from '../_shared/gbp-oauth-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Manually refreshing OAuth2 token...');

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
    const { integration_id } = await req.json();
    
    if (!integration_id) {
      throw new Error('Missing integration_id');
    }

    // Get integration
    const { data: integration, error: integrationError } = await supabase
      .from('google_business_profiles')
      .select(`
        *,
        rank_rent_sites!inner(owner_user_id)
      `)
      .eq('id', integration_id)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integration not found');
    }

    // Check ownership
    if ((integration as any).rank_rent_sites?.owner_user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    if (!integration.refresh_token) {
      throw new Error('Integration missing refresh_token');
    }

    // Refresh token
    const { access_token, expires_in } = await refreshAccessToken(integration.refresh_token);

    // Calculate new expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Update database
    const { error: updateError } = await supabase
      .from('google_business_profiles')
      .update({
        access_token,
        token_expires_at: expiresAt.toISOString(),
        health_status: 'healthy',
        last_error: null,
        consecutive_failures: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration_id);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Token refreshed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        expires_in,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gbp-oauth-refresh:', error);
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

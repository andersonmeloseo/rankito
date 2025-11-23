import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { getIntegrationWithValidToken } from '../_shared/gbp-oauth-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💬 Processing review response...');

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
    const { review_id, reply_text } = await req.json();
    
    if (!review_id || !reply_text) {
      throw new Error('Missing required fields: review_id, reply_text');
    }

    console.log(`📋 User: ${user.id}, Review: ${review_id}`);

    // Get review with profile info
    const { data: review, error: reviewError } = await supabase
      .from('gbp_reviews')
      .select(`
        *,
        google_business_profiles!inner(
          id,
          location_name,
          site_id,
          rank_rent_sites!inner(owner_user_id)
        )
      `)
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      throw new Error('Review not found');
    }

    const profile = review.google_business_profiles as any;

    // Check ownership
    if (profile.rank_rent_sites.owner_user_id !== user.id) {
      throw new Error('Unauthorized to respond to this review');
    }

    // Generate access token via JWT
    console.log('🔐 Generating access token...');
    const integration = await getIntegrationWithValidToken(profile.id);
    const accessToken = integration.access_token;

    // Post reply to Google
    const replyResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/${profile.location_name}/reviews/${review.google_review_id}/reply`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: reply_text,
        }),
      }
    );

    if (!replyResponse.ok) {
      const errorText = await replyResponse.text();
      console.error('❌ Failed to post reply:', errorText);
      throw new Error('Failed to post reply to Google');
    }

    console.log('✅ Reply posted to Google successfully');

    // Update review in database
    await supabase
      .from('gbp_reviews')
      .update({
        review_reply: reply_text,
        review_reply_at: new Date().toISOString(),
        is_replied: true,
      })
      .eq('id', review_id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gbp-respond-review:', error);
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

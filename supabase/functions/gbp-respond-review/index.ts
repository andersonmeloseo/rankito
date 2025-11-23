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
          access_token,
          refresh_token,
          token_expires_at,
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

    const profile = review.google_business_profiles;

    // Check ownership
    if (profile.rank_rent_sites.owner_user_id !== user.id) {
      throw new Error('Unauthorized to respond to this review');
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
        .eq('id', review.profile_id);
    }

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

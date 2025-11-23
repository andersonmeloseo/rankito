import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { getIntegrationWithValidToken, markIntegrationHealthy, markIntegrationUnhealthy, isAuthError } from '../_shared/gbp-oauth-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function analyzeSentiment(reviewText: string, rating: number): Promise<string> {
  // Simple sentiment based on rating
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting GBP reviews sync...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active GBP profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('is_active', true);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('ℹ️ No active GBP profiles found');
      return new Response(
        JSON.stringify({ success: true, profilesProcessed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Processing ${profiles.length} profiles...`);

    let totalReviewsSynced = 0;
    let profilesProcessed = 0;

    for (const profile of profiles) {
      try {
        console.log(`🔄 Processing profile: ${profile.connection_name}`);

        // Generate access token via JWT
        console.log(`🔐 Generating token for profile ${profile.id}...`);
        const integration = await getIntegrationWithValidToken(profile.id);
        const accessToken = integration.access_token;

        if (!profile.location_name) {
          console.log('⚠️ No location name, skipping...');
          continue;
        }

        // Fetch reviews from Google (Business Information API - moderna)
        const reviewsResponse = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${profile.location_name}/reviews`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        );

        if (!reviewsResponse.ok) {
          throw new Error(`Failed to fetch reviews: ${reviewsResponse.status}`);
        }

        const reviewsData = await reviewsResponse.json();
        const reviews = reviewsData.reviews || [];

        console.log(`📝 Found ${reviews.length} reviews`);

        // Process each review
        for (const review of reviews) {
          const sentiment = await analyzeSentiment(
            review.comment || '',
            review.starRating === 'FIVE' ? 5 :
            review.starRating === 'FOUR' ? 4 :
            review.starRating === 'THREE' ? 3 :
            review.starRating === 'TWO' ? 2 : 1
          );

          const reviewData = {
            profile_id: profile.id,
            site_id: profile.site_id,
            google_review_id: review.reviewId || review.name,
            reviewer_name: review.reviewer?.displayName || 'Anonymous',
            reviewer_photo_url: review.reviewer?.profilePhotoUrl || null,
            star_rating: review.starRating === 'FIVE' ? 5 :
                        review.starRating === 'FOUR' ? 4 :
                        review.starRating === 'THREE' ? 3 :
                        review.starRating === 'TWO' ? 2 : 1,
            review_text: review.comment || null,
            review_reply: review.reviewReply?.comment || null,
            review_reply_at: review.reviewReply?.updateTime || null,
            is_replied: !!review.reviewReply,
            is_read: false,
            sentiment,
            created_at: review.createTime,
            updated_at: review.updateTime || review.createTime,
            synced_at: new Date().toISOString(),
          };

          // Upsert review
          await supabase
            .from('gbp_reviews')
            .upsert(reviewData, {
              onConflict: 'google_review_id',
            });
        }

        totalReviewsSynced += reviews.length;
        profilesProcessed++;

        // Mark profile as healthy
        await markIntegrationHealthy(profile.id);

      } catch (error) {
        console.error(`❌ Error processing profile ${profile.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await markIntegrationUnhealthy(profile.id, errorMessage);
        continue;
      }
    }

    console.log(`✅ Sync completed. ${totalReviewsSynced} reviews synced from ${profilesProcessed} profiles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profilesProcessed,
        totalReviewsSynced,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gbp-sync-reviews:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

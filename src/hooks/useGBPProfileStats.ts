import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfileStats {
  averageRating: number;
  totalReviews: number;
  totalPosts: number;
  totalPhotos: number;
  scheduledPosts: number;
  unreadReviews: number;
  respondedReviews: number;
  profileViews?: number;
  profileSearches?: number;
}

export const useGBPProfileStats = (profileId: string) => {
  return useQuery({
    queryKey: ['gbp-profile-stats', profileId],
    queryFn: async (): Promise<ProfileStats> => {
      // Fetch reviews stats
      const { data: reviews, error: reviewsError } = await supabase
        .from('gbp_reviews')
        .select('star_rating, is_read, is_replied')
        .eq('profile_id', profileId);

      if (reviewsError) throw reviewsError;

      // Fetch posts stats
      const { data: posts, error: postsError } = await supabase
        .from('gbp_posts')
        .select('status')
        .eq('profile_id', profileId);

      if (postsError) throw postsError;

      // Fetch photos stats
      const { data: photos, error: photosError } = await supabase
        .from('gbp_photos')
        .select('id')
        .eq('profile_id', profileId);

      if (photosError) throw photosError;

      // Fetch analytics stats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: analytics, error: analyticsError } = await supabase
        .from('gbp_analytics')
        .select('profile_views, searches_direct, searches_discovery, searches_branded')
        .eq('profile_id', profileId)
        .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (analyticsError) throw analyticsError;

      // Calculate stats
      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.star_rating, 0) / reviews.length
        : 0;

      const totalReviews = reviews?.length || 0;
      const unreadReviews = reviews?.filter(r => !r.is_read).length || 0;
      const respondedReviews = reviews?.filter(r => r.is_replied).length || 0;

      const totalPosts = posts?.filter(p => p.status === 'published').length || 0;
      const scheduledPosts = posts?.filter(p => p.status === 'scheduled').length || 0;

      const totalPhotos = photos?.length || 0;

      const profileViews = analytics?.reduce((sum, a) => sum + (a.profile_views || 0), 0) || 0;
      const profileSearches = analytics?.reduce((sum, a) => 
        sum + (a.searches_direct || 0) + (a.searches_discovery || 0) + (a.searches_branded || 0), 0
      ) || 0;

      return {
        averageRating,
        totalReviews,
        totalPosts,
        totalPhotos,
        scheduledPosts,
        unreadReviews,
        respondedReviews,
        profileViews,
        profileSearches,
      };
    },
    enabled: !!profileId,
  });
};

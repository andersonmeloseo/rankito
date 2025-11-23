import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseGBPReviewsFilters {
  status?: string;
  rating?: number;
  sentiment?: string;
}

export const useGBPReviews = (siteId: string, filters?: UseGBPReviewsFilters) => {
  const queryClient = useQueryClient();

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['gbp-reviews', siteId, filters],
    queryFn: async () => {
      let query = supabase
        .from('gbp_reviews')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (filters?.status === 'unanswered') {
        query = query.eq('is_replied', false);
      } else if (filters?.status === 'answered') {
        query = query.eq('is_replied', true);
      }

      if (filters?.rating) {
        query = query.eq('star_rating', filters.rating);
      }

      if (filters?.sentiment) {
        query = query.eq('sentiment', filters.sentiment);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Calculate metrics
  const { data: metrics } = useQuery({
    queryKey: ['gbp-reviews-metrics', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_reviews')
        .select('star_rating, is_replied')
        .eq('site_id', siteId);

      if (error) throw error;

      const total = data.length;
      const avgRating = total > 0 
        ? data.reduce((sum, r) => sum + r.star_rating, 0) / total 
        : 0;
      const repliedCount = data.filter(r => r.is_replied).length;
      const replyRate = total > 0 ? (repliedCount / total) * 100 : 0;

      const distribution = {
        5: data.filter(r => r.star_rating === 5).length,
        4: data.filter(r => r.star_rating === 4).length,
        3: data.filter(r => r.star_rating === 3).length,
        2: data.filter(r => r.star_rating === 2).length,
        1: data.filter(r => r.star_rating === 1).length,
      };

      return {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        replyRate: Math.round(replyRate),
        distribution,
      };
    },
    enabled: !!siteId,
  });

  // Respond to review
  const respondReview = useMutation({
    mutationFn: async ({ reviewId, replyText }: { reviewId: string; replyText: string }) => {
      const { data, error } = await supabase.functions.invoke('gbp-respond-review', {
        body: { review_id: reviewId, reply_text: replyText },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Resposta enviada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['gbp-reviews-metrics'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao responder: ${error.message}`);
    },
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('gbp_reviews')
        .update({ is_read: true })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gbp-reviews'] });
    },
  });

  return {
    reviews,
    metrics,
    isLoading,
    isResponding: respondReview.isPending,
    respondReview: respondReview.mutate,
    markAsRead: markAsRead.mutate,
  };
};

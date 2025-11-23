import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGBPProfileReviews = (profileId: string) => {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['gbp-profile-reviews', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_reviews')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const replyToReview = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      const { error } = await supabase
        .from('gbp_reviews')
        .update({
          review_reply: reply,
          review_reply_at: new Date().toISOString(),
          is_replied: true,
        })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resposta enviada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-profile-reviews', profileId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar resposta: ${error.message}`);
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('gbp_reviews')
        .update({ is_read: true })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gbp-profile-reviews', profileId] });
    },
  });

  const metrics = {
    total: reviews?.length || 0,
    averageRating: reviews?.reduce((acc, r) => acc + r.star_rating, 0) / (reviews?.length || 1),
    responseRate: reviews?.filter(r => r.is_replied).length / (reviews?.length || 1) * 100,
    unread: reviews?.filter(r => !r.is_read).length || 0,
  };

  return {
    reviews,
    isLoading,
    replyToReview: replyToReview.mutate,
    isReplying: replyToReview.isPending,
    markAsRead: markAsRead.mutate,
    metrics,
  };
};

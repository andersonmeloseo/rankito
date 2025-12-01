import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFeatureVotes = (requestId: string) => {
  const queryClient = useQueryClient();

  const { data: userVote, isLoading } = useQuery({
    queryKey: ['feature-vote', requestId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('feature_request_votes')
        .select('*')
        .eq('request_id', requestId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const toggleVote = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (userVote) {
        // Remove vote
        const { error } = await supabase
          .from('feature_request_votes')
          .delete()
          .eq('id', userVote.id);

        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase
          .from('feature_request_votes')
          .insert({
            request_id: requestId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-vote', requestId] });
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
      toast.success(userVote ? 'Voto removido!' : 'Voto registrado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao votar: ${error.message}`);
    },
  });

  return {
    hasVoted: !!userVote,
    isLoading,
    toggleVote: toggleVote.mutate,
  };
};

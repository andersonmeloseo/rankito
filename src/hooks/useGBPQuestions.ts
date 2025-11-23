import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGBPQuestions = (profileId: string) => {
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['gbp-questions', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_questions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const answerQuestion = useMutation({
    mutationFn: async ({ questionId, answerText }: { questionId: string; answerText: string }) => {
      const { error } = await supabase
        .from('gbp_questions')
        .update({
          answer_text: answerText,
          is_answered: true,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resposta enviada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-questions', profileId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao responder: ${error.message}`);
    },
  });

  return {
    questions,
    isLoading,
    answerQuestion: answerQuestion.mutate,
    isAnswering: answerQuestion.isPending,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'new_feature' | 'improvement' | 'integration' | 'other';
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'implemented';
  admin_notes: string | null;
  rejection_reason: string | null;
  linked_backlog_id: string | null;
  votes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export const useFeatureRequests = (adminView = false) => {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['feature-requests', adminView],
    queryFn: async () => {
      let query = supabase
        .from('feature_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Se não é admin, filtra apenas as não rejeitadas
      if (!adminView) {
        query = query.neq('status', 'rejected');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FeatureRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (request: { title: string; description: string; category: 'new_feature' | 'improvement' | 'integration' | 'other' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('feature_requests')
        .insert([{
          title: request.title,
          description: request.description,
          category: request.category,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
      toast.success('Solicitação enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar solicitação: ${error.message}`);
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeatureRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('feature_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
      toast.success('Solicitação atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  return {
    requests: requests || [],
    isLoading,
    createRequest: createRequest.mutate,
    updateRequest: updateRequest.mutate,
  };
};

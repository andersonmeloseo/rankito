import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IndexNowSubmission {
  id: string;
  site_id: string;
  user_id: string;
  urls_count: number;
  status: 'success' | 'failed' | 'partial';
  status_code: number | null;
  response_data: string | null;
  request_payload: any;
  created_at: string;
  updated_at: string;
}

interface SubmitUrlsParams {
  urls: string[];
  key: string;
  host: string;
}

export const useIndexNow = (siteId: string) => {
  const queryClient = useQueryClient();

  // Buscar histórico de submissões
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['indexnow-submissions', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indexnow_submissions')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as IndexNowSubmission[];
    },
  });

  // Submeter URLs para IndexNow
  const submitUrls = useMutation({
    mutationFn: async ({ urls, key, host }: SubmitUrlsParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('indexnow-submit', {
        body: { 
          urls, 
          key, 
          host,
          siteId,
          userId: user.id
        },
      });

      if (error) throw error;
      
      // Se a API retornou success: false, lançar erro
      if (data && !data.success) {
        throw new Error(data.message || data.error || 'Erro ao submeter URLs');
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data?.message) {
        toast.success(data.message, {
          duration: 5000,
        });
      } else {
        toast.success('URLs submetidas com sucesso!');
      }
      queryClient.invalidateQueries({ queryKey: ['indexnow-submissions', siteId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao submeter URLs: ${error.message}`, {
        duration: 5000,
      });
    },
  });

  return {
    submissions,
    isLoading,
    submitUrls: submitUrls.mutate,
    isSubmitting: submitUrls.isPending,
  };
};

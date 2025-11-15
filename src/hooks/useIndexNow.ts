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
}

interface SiteKey {
  indexnow_key: string | null;
  site_url: string;
}

export const useIndexNow = (siteId: string) => {
  const queryClient = useQueryClient();

  // Buscar chave do site
  const { data: siteKey, isLoading: isLoadingKey } = useQuery({
    queryKey: ['indexnow-key', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_sites')
        .select('indexnow_key, site_url')
        .eq('id', siteId)
        .single();

      if (error) throw error;
      return data as SiteKey;
    },
  });

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
    mutationFn: async ({ urls }: SubmitUrlsParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('indexnow-submit', {
        body: { 
          urls,
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

  // Regenerar chave
  const regenerateKey = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('indexnow-regenerate-key', {
        body: { siteId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Chave IndexNow regenerada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['indexnow-key', siteId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao regenerar chave: ${error.message}`);
    },
  });

  return {
    submissions,
    isLoading,
    siteKey,
    isLoadingKey,
    submitUrls: submitUrls.mutate,
    isSubmitting: submitUrls.isPending,
    regenerateKey: regenerateKey.mutate,
    isRegenerating: regenerateKey.isPending,
  };
};

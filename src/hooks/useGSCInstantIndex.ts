import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstantIndexParams {
  siteId: string;
  urls: string[];
  integrationId?: string;
  jobId?: string;
}

interface InstantIndexResult {
  success: boolean;
  results: Array<{
    url: string;
    status: 'success' | 'failed';
    error?: string;
    error_type?: string;
  }>;
  urls_processed: number;
  urls_successful: number;
  urls_failed: number;
}

export function useGSCInstantIndex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, urls, integrationId, jobId }: InstantIndexParams) => {
      console.log('📤 Starting Instant Indexing:', { siteId, urlCount: urls.length });

      const { data, error } = await supabase.functions.invoke<InstantIndexResult>(
        'gsc-instant-index',
        {
          body: {
            site_id: siteId,
            urls,
            integration_id: integrationId,
            job_id: jobId,
          },
        }
      );

      if (error) {
        console.error('❌ Error in instant indexing:', error);
        throw new Error(error.message || 'Failed to index URLs');
      }

      console.log('✅ Instant indexing completed:', data);
      return data;
    },
    onSuccess: (data) => {
      const { urls_successful, urls_failed, urls_processed } = data;
      
      if (urls_failed === 0) {
        toast.success(`${urls_successful} URLs indexadas com sucesso`);
      } else {
        toast.warning(`${urls_successful} URLs indexadas, ${urls_failed} falharam`, {
          description: 'Verifique os alertas para mais detalhes',
        });
      }

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-alerts'] });
    },
    onError: (error: Error) => {
      console.error('❌ Indexing failed:', error);
      toast.error('Falha ao indexar URLs', {
        description: error.message,
      });
    },
  });
}

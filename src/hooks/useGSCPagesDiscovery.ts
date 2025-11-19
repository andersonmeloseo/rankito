import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PagesDiscoveryParams {
  siteId: string;
  integrationId: string;
  months?: number;
}

interface PagesDiscoveryResult {
  success: boolean;
  pages_discovered: number;
  pages_inserted: number;
  job_id: string;
  message?: string;
}

export function useGSCPagesDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, integrationId, months = 16 }: PagesDiscoveryParams) => {
      console.log('🔍 Starting GSC Pages Discovery:', { siteId, integrationId, months });

      const { data, error } = await supabase.functions.invoke<PagesDiscoveryResult>(
        'gsc-pages-discovery',
        {
          body: { site_id: siteId, integration_id: integrationId, months },
        }
      );

      if (error) {
        console.error('❌ Error in pages discovery:', error);
        throw new Error(error.message || 'Failed to discover pages');
      }

      console.log('✅ Pages discovery completed:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.pages_discovered} URLs descobertas no GSC`, {
        description: `${data.pages_inserted} URLs inseridas no banco de dados`,
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-search-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-jobs'] });
    },
    onError: (error: Error) => {
      console.error('❌ Discovery failed:', error);
      toast.error('Falha ao descobrir páginas', {
        description: error.message,
      });
    },
  });
}

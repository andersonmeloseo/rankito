import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGSCDiscoveredUrls = (siteId: string) => {
  const queryClient = useQueryClient();

  // Query separada para contagem total real do banco
  const { data: realTotalCount } = useQuery({
    queryKey: ['gsc-discovered-urls-total-count', siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!siteId,
  });

  const { data: urls, isLoading } = useQuery({
    queryKey: ['gsc-discovered-urls', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_discovered_urls')
        .select(`
          *,
          validation_status,
          validation_error,
          validated_at,
          retry_count,
          last_retry_at,
          next_retry_at,
          retry_reason,
          google_inspection_status,
          google_last_inspected_at,
          google_inspection_data
        `)
        .eq('site_id', siteId)
        .order('last_seen_at', { ascending: false })
        .range(0, 99999);

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
    staleTime: 0,
    gcTime: 0,
  });

  const updateUrlStatus = useMutation({
    mutationFn: async ({ urlId, status }: { urlId: string; status: string }) => {
      const { error } = await supabase
        .from('gsc_discovered_urls')
        .update({ current_status: status, updated_at: new Date().toISOString() })
        .eq('id', urlId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  return {
    urls,
    isLoading,
    totalCount: urls?.length || 0,
    realTotalCount: realTotalCount || 0,
    updateUrlStatus,
  };
};

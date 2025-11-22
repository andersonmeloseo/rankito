import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseGSCDiscoveredUrlsFilters {
  status?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export const useGSCDiscoveredUrls = (
  siteId: string,
  filters?: UseGSCDiscoveredUrlsFilters
) => {
  const queryClient = useQueryClient();

  const { data: urls, isLoading } = useQuery({
    queryKey: ['gsc-discovered-urls', siteId, filters?.searchTerm],
    queryFn: async () => {
      let query = supabase
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
        .order('last_seen_at', { ascending: false });

      if (filters?.searchTerm) {
        query = query.ilike('url', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
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
    updateUrlStatus,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseGSCDiscoveredUrlsFilters {
  status?: string;
  searchTerm?: string;
  integrationId?: string;
  page?: number;
  pageSize?: number;
}

export const useGSCDiscoveredUrls = (
  siteId: string,
  filters?: UseGSCDiscoveredUrlsFilters
) => {
  const queryClient = useQueryClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 100;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: countData } = useQuery({
    queryKey: ['gsc-discovered-urls-count', siteId, filters?.status, filters?.integrationId, filters?.searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('current_status', filters.status);
      }
      if (filters?.integrationId) {
        query = query.eq('integration_id', filters.integrationId);
      }
      if (filters?.searchTerm) {
        query = query.ilike('url', `%${filters.searchTerm}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!siteId,
  });

  const { data: urls, isLoading } = useQuery({
    queryKey: ['gsc-discovered-urls', siteId, filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('gsc_discovered_urls')
        .select('*')
        .eq('site_id', siteId)
        .order('last_seen_at', { ascending: false })
        .range(from, to);

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('current_status', filters.status);
      }

      if (filters?.integrationId) {
        query = query.eq('integration_id', filters.integrationId);
      }

      if (filters?.searchTerm) {
        query = query.ilike('url', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  const totalPages = Math.ceil((countData || 0) / pageSize);

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
    totalCount: countData || 0,
    currentPage: page,
    totalPages,
    pageSize,
    updateUrlStatus,
  };
};

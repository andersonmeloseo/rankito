import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GSCSitemap {
  id?: string;
  sitemap_url: string;
  sitemap_type: 'index' | 'regular';
  gsc_status: string;
  gsc_last_submitted: string | null;
  gsc_last_downloaded: string | null;
  urls_submitted: number;
  urls_indexed: number;
  gsc_errors_count: number;
  gsc_warnings_count: number;
  source?: 'gsc' | 'database';
  in_database?: boolean;
  possibly_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UseGSCSitemapsParams {
  integrationId: string | null;
}

export function useGSCSitemaps({ integrationId }: UseGSCSitemapsParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sitemaps
  const { data: sitemaps, isLoading, error, refetch } = useQuery({
    queryKey: ['gsc-sitemaps', integrationId],
    queryFn: async () => {
      if (!integrationId) return [];

      console.log('🔍 Fetching GSC sitemaps for integration:', integrationId);

      const { data, error } = await supabase.functions.invoke('gsc-get-sitemaps', {
        body: { integration_id: integrationId },
      });

      if (error) {
        console.error('❌ Error fetching sitemaps:', error);
        throw new Error(error.message || 'Failed to fetch sitemaps');
      }

      console.log('✅ Sitemaps fetched:', data.sitemaps?.length);
      return data.sitemaps as GSCSitemap[];
    },
    enabled: !!integrationId,
  });

  // Submit sitemap mutation
  const submitSitemap = useMutation({
    mutationFn: async ({ sitemap_url }: { sitemap_url: string }) => {
      if (!integrationId) throw new Error('No integration selected');

      console.log('📤 Submitting sitemap:', sitemap_url);

      const { data, error } = await supabase.functions.invoke('gsc-submit-sitemap', {
        body: {
          integration_id: integrationId,
          sitemap_url,
        },
      });

      if (error) {
        console.error('❌ Error submitting sitemap:', error);
        throw new Error(error.message || 'Failed to submit sitemap');
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sitemap submetido!",
        description: "Sitemap foi enviado ao Google Search Console com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps', integrationId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao submeter sitemap",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete sitemap mutation
  const deleteSitemap = useMutation({
    mutationFn: async ({ sitemap_url }: { sitemap_url: string }) => {
      if (!integrationId) throw new Error('No integration selected');

      console.log('🗑️ Deleting sitemap:', sitemap_url);

      const { data, error } = await supabase.functions.invoke('gsc-delete-sitemap', {
        body: {
          integration_id: integrationId,
          sitemap_url,
        },
      });

      if (error) {
        console.error('❌ Error deleting sitemap:', error);
        throw new Error(error.message || 'Failed to delete sitemap');
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sitemap removido!",
        description: "Sitemap foi removido do Google Search Console.",
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps', integrationId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover sitemap",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sitemaps: sitemaps || [],
    isLoading,
    error,
    refetch,
    submitSitemap,
    deleteSitemap,
    isSubmitting: submitSitemap.isPending,
    isDeleting: deleteSitemap.isPending,
  };
}

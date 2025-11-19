import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DiscoveredUrl {
  id: string;
  site_id: string;
  page_id: string | null;
  url: string;
  gsc_data: boolean;
  sitemap_found: boolean;
  sitemap_url: string | null;
  sitemap_id: string | null;
  lastmod: string | null;
  priority: number | null;
  current_status: 'indexed' | 'sent_for_indexing' | 'failed' | 'not_indexed' | 'unknown';
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseGSCDiscoveredUrlsParams {
  siteId: string | null;
  status?: string;
  gscData?: boolean;
  sitemapFound?: boolean;
  limit?: number;
}

export function useGSCDiscoveredUrls({
  siteId,
  status,
  gscData,
  sitemapFound,
  limit = 1000,
}: UseGSCDiscoveredUrlsParams) {
  return useQuery({
    queryKey: ['gsc-discovered-urls', siteId, status, gscData, sitemapFound, limit],
    queryFn: async () => {
      if (!siteId) return [];

      console.log('🔍 Fetching discovered URLs for site:', siteId);

      let query = supabase
        .from('gsc_discovered_urls' as any)
        .select('*')
        .eq('site_id', siteId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('current_status', status);
      }

      if (gscData !== undefined) {
        query = query.eq('gsc_data', gscData);
      }

      if (sitemapFound !== undefined) {
        query = query.eq('sitemap_found', sitemapFound);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching discovered URLs:', error);
        throw error;
      }

      console.log('✅ Discovered URLs fetched:', data?.length || 0);
      return (data || []) as unknown as DiscoveredUrl[];
    },
    enabled: !!siteId,
    refetchInterval: 30000, // Refetch a cada 30s
  });
}

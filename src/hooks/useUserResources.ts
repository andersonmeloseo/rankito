import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserSiteResource {
  id: string;
  site_name: string;
  site_url: string;
  niche: string;
  total_pages: number;
  total_conversions: number;
  gsc_integrations_count: number;
  indexing_requests_count: number;
  recent_indexing_requests: number;
  created_at: string;
}

export interface UserResourcesSummary {
  totalSites: number;
  totalPages: number;
  totalConversions: number;
  totalGscIntegrations: number;
  totalIndexingRequests: number;
}

export interface UserResourcesData {
  sites: UserSiteResource[];
  summary: UserResourcesSummary;
}

export const useUserResources = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-resources', userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      // Fetch sites with aggregated metrics
      const { data: sites, error } = await supabase
        .from('rank_rent_sites')
        .select(`
          id,
          site_name,
          site_url,
          niche,
          created_at
        `)
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each site, fetch detailed metrics
      const sitesWithMetrics = await Promise.all(
        (sites || []).map(async (site) => {
          // Count pages
          const { count: pagesCount } = await supabase
            .from('rank_rent_pages')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id);

          // Count conversions
          const { count: conversionsCount } = await supabase
            .from('rank_rent_conversions')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id);

          // Count GSC integrations
          const { count: gscCount } = await supabase
            .from('google_search_console_integrations')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id)
            .eq('is_active', true);

          // Count indexing requests
          const { count: indexingCount } = await supabase
            .from('gsc_url_indexing_requests')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id);

          // Count recent indexing requests (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { count: recentIndexingCount } = await supabase
            .from('gsc_url_indexing_requests')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          return {
            ...site,
            total_pages: pagesCount || 0,
            total_conversions: conversionsCount || 0,
            gsc_integrations_count: gscCount || 0,
            indexing_requests_count: indexingCount || 0,
            recent_indexing_requests: recentIndexingCount || 0,
          };
        })
      );

      // Calculate summary
      const summary: UserResourcesSummary = {
        totalSites: sitesWithMetrics.length,
        totalPages: sitesWithMetrics.reduce((sum, s) => sum + s.total_pages, 0),
        totalConversions: sitesWithMetrics.reduce((sum, s) => sum + s.total_conversions, 0),
        totalGscIntegrations: sitesWithMetrics.reduce((sum, s) => sum + s.gsc_integrations_count, 0),
        totalIndexingRequests: sitesWithMetrics.reduce((sum, s) => sum + s.indexing_requests_count, 0),
      };

      return {
        sites: sitesWithMetrics,
        summary,
      } as UserResourcesData;
    },
    enabled: !!userId,
  });
};

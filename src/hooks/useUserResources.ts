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

      // OTIMIZAÇÃO: Buscar todos os dados em paralelo ao invés de N+1 queries
      const [sitesResult, pagesResult, metricsResult, gscResult, indexingResult] = await Promise.all([
        // Sites do usuário
        supabase
          .from('rank_rent_sites')
          .select('id, site_name, site_url, niche, created_at')
          .eq('owner_user_id', userId)
          .order('created_at', { ascending: false }),
        
        // Todas as páginas (agregado por site)
        supabase
          .from('rank_rent_pages')
          .select('site_id'),
        
        // Usar cache de métricas ao invés de contar conversões
        supabase
          .from('rank_rent_site_metrics_cache')
          .select('site_id, total_conversions'),
        
        // GSC integrations
        supabase
          .from('google_search_console_integrations')
          .select('site_id')
          .eq('is_active', true),
        
        // Indexing requests
        supabase
          .from('gsc_url_indexing_requests')
          .select('site_id, created_at')
      ]);

      if (sitesResult.error) throw sitesResult.error;

      const sites = sitesResult.data || [];
      const siteIds = new Set(sites.map(s => s.id));

      // Filtrar e agregar dados por site
      const pagesData = pagesResult.data || [];
      const metricsData = metricsResult.data || [];
      const gscData = gscResult.data || [];
      const indexingData = indexingResult.data || [];

      // Criar mapas para lookup rápido
      const pagesCountBySite = new Map<string, number>();
      pagesData.forEach(p => {
        if (siteIds.has(p.site_id)) {
          pagesCountBySite.set(p.site_id, (pagesCountBySite.get(p.site_id) || 0) + 1);
        }
      });

      const conversionsBySite = new Map<string, number>();
      metricsData.forEach(m => {
        if (siteIds.has(m.site_id)) {
          conversionsBySite.set(m.site_id, m.total_conversions || 0);
        }
      });

      const gscCountBySite = new Map<string, number>();
      gscData.forEach(g => {
        if (siteIds.has(g.site_id)) {
          gscCountBySite.set(g.site_id, (gscCountBySite.get(g.site_id) || 0) + 1);
        }
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const indexingCountBySite = new Map<string, { total: number; recent: number }>();
      indexingData.forEach(i => {
        if (siteIds.has(i.site_id)) {
          const current = indexingCountBySite.get(i.site_id) || { total: 0, recent: 0 };
          current.total++;
          if (new Date(i.created_at) >= thirtyDaysAgo) {
            current.recent++;
          }
          indexingCountBySite.set(i.site_id, current);
        }
      });

      // Montar os sites com métricas
      const sitesWithMetrics: UserSiteResource[] = sites.map(site => ({
        ...site,
        total_pages: pagesCountBySite.get(site.id) || 0,
        total_conversions: conversionsBySite.get(site.id) || 0,
        gsc_integrations_count: gscCountBySite.get(site.id) || 0,
        indexing_requests_count: indexingCountBySite.get(site.id)?.total || 0,
        recent_indexing_requests: indexingCountBySite.get(site.id)?.recent || 0,
      }));

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
    staleTime: 60000, // 1 minuto de cache
    gcTime: 120000, // 2 minutos em memória
  });
};

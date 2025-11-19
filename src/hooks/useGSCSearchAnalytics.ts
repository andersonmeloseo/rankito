import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseGSCSearchAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  device?: string;
  country?: string;
}

export const useGSCSearchAnalytics = (
  siteId: string,
  filters?: UseGSCSearchAnalyticsFilters
) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['gsc-search-analytics', siteId, filters],
    queryFn: async () => {
      let query = supabase
        .from('gsc_search_analytics')
        .select('*')
        .eq('site_id', siteId)
        .order('date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      if (filters?.device && filters.device !== 'all') {
        query = query.eq('device', filters.device);
      }

      if (filters?.country && filters.country !== 'all') {
        query = query.eq('country', filters.country);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  const { data: aggregates } = useQuery({
    queryKey: ['gsc-search-analytics-aggregates', siteId, filters],
    queryFn: async () => {
      const analyticsData = analytics || [];

      const totalImpressions = analyticsData.reduce((sum, a) => sum + (a.impressions || 0), 0);
      const totalClicks = analyticsData.reduce((sum, a) => sum + (a.clicks || 0), 0);
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgPosition = analyticsData.length > 0
        ? analyticsData.reduce((sum, a) => sum + (a.position || 0), 0) / analyticsData.length
        : 0;

      // Top pages by impressions
      const pageStats = analyticsData.reduce((acc: any, curr) => {
        const page = curr.page;
        if (!acc[page]) {
          acc[page] = { impressions: 0, clicks: 0 };
        }
        acc[page].impressions += curr.impressions || 0;
        acc[page].clicks += curr.clicks || 0;
        return acc;
      }, {});

      const topPages = Object.entries(pageStats)
        .map(([page, stats]: any) => ({
          page,
          impressions: stats.impressions,
          clicks: stats.clicks,
          ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);

      return {
        totalImpressions,
        totalClicks,
        avgCtr,
        avgPosition,
        topPages,
      };
    },
    enabled: !!analytics,
  });

  return {
    analytics,
    aggregates,
    isLoading,
  };
};

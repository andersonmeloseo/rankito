import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format } from "date-fns";

export const useGBPAnalytics = (siteId: string, days: number = 30) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['gbp-analytics', siteId, days],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), days), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('gbp_analytics')
        .select('*')
        .eq('site_id', siteId)
        .gte('metric_date', startDate)
        .order('metric_date', { ascending: true });

      if (error) throw error;

      // Calculate totals
      const totals = data.reduce((acc, day) => ({
        searchesDirect: acc.searchesDirect + (day.searches_direct || 0),
        searchesDiscovery: acc.searchesDiscovery + (day.searches_discovery || 0),
        searchesBranded: acc.searchesBranded + (day.searches_branded || 0),
        actionsWebsite: acc.actionsWebsite + (day.actions_website || 0),
        actionsPhone: acc.actionsPhone + (day.actions_phone || 0),
        actionsDirections: acc.actionsDirections + (day.actions_directions || 0),
        profileViews: acc.profileViews + (day.profile_views || 0),
      }), {
        searchesDirect: 0,
        searchesDiscovery: 0,
        searchesBranded: 0,
        actionsWebsite: 0,
        actionsPhone: 0,
        actionsDirections: 0,
        profileViews: 0,
      });

      // Format chart data
      const chartData = data.map(day => ({
        date: format(new Date(day.metric_date), 'dd/MM'),
        searches: (day.searches_direct || 0) + (day.searches_discovery || 0) + (day.searches_branded || 0),
        actions: (day.actions_website || 0) + (day.actions_phone || 0) + (day.actions_directions || 0),
        views: day.profile_views || 0,
      }));

      return {
        daily: data,
        totals,
        chartData,
      };
    },
    enabled: !!siteId,
  });

  return {
    analytics,
    isLoading,
  };
};

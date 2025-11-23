import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

export const useGBPProfileAnalytics = (profileId: string, period: number = 30) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['gbp-profile-analytics', profileId, period],
    queryFn: async () => {
      const startDate = subDays(new Date(), period);
      
      const { data, error } = await supabase
        .from('gbp_analytics')
        .select('*')
        .eq('profile_id', profileId)
        .gte('metric_date', format(startDate, 'yyyy-MM-dd'))
        .order('metric_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const metrics = {
    totalSearches: analytics?.reduce((sum, item) => 
      sum + (item.searches_direct || 0) + (item.searches_discovery || 0) + (item.searches_branded || 0), 0) || 0,
    totalActions: analytics?.reduce((sum, item) => 
      sum + (item.actions_website || 0) + (item.actions_phone || 0) + (item.actions_directions || 0), 0) || 0,
    totalViews: analytics?.reduce((sum, item) => sum + (item.profile_views || 0), 0) || 0,
    averagePosition: analytics?.length 
      ? analytics.reduce((sum, item) => sum + (item.queries_direct || 0), 0) / analytics.length 
      : 0,
  };

  const chartData = analytics?.map(item => ({
    date: format(new Date(item.metric_date), 'dd/MM'),
    searches: (item.searches_direct || 0) + (item.searches_discovery || 0) + (item.searches_branded || 0),
    views: item.profile_views || 0,
    actions: (item.actions_website || 0) + (item.actions_phone || 0) + (item.actions_directions || 0),
  })) || [];

  const actionsByType = {
    website: analytics?.reduce((sum, item) => sum + (item.actions_website || 0), 0) || 0,
    phone: analytics?.reduce((sum, item) => sum + (item.actions_phone || 0), 0) || 0,
    directions: analytics?.reduce((sum, item) => sum + (item.actions_directions || 0), 0) || 0,
  };

  return {
    analytics,
    isLoading,
    metrics,
    chartData,
    actionsByType,
  };
};

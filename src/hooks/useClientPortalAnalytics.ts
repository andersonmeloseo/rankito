import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const useClientPortalAnalytics = (clientId: string, periodDays: number = 30) => {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['client-portal-analytics', clientId, periodDays],
    queryFn: async () => {
      // Fetch client sites
      const { data: sites, error: sitesError } = await supabase
        .from('rank_rent_sites')
        .select(`
          *,
          rank_rent_pages(*)
        `)
        .eq('client_id', clientId);

      if (sitesError) throw sitesError;

      const siteIds = sites?.map(s => s.id) || [];
      const startDate = startOfDay(subDays(new Date(), periodDays));
      const endDate = endOfDay(new Date());

      // Fetch conversions
      const { data: conversions, error: conversionsError } = await supabase
        .from('rank_rent_conversions')
        .select('*')
        .in('site_id', siteIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversionsError) throw conversionsError;

      // Calculate metrics
      const totalPages = sites?.reduce((acc, s) => acc + (s.rank_rent_pages?.length || 0), 0) || 0;
      const totalConversions = conversions?.length || 0;
      const pageViews = conversions?.filter(c => c.event_type === 'page_view').length || 0;
      const conversionRate = pageViews > 0 ? (totalConversions / pageViews) * 100 : 0;
      
      // Monthly revenue
      const monthlyRevenue = sites?.reduce((acc, s) => acc + (Number(s.monthly_rent_value) || 0), 0) || 0;

      // Group conversions by day
      const dailyStats = conversions?.reduce((acc: any, conv) => {
        const date = new Date(conv.created_at).toLocaleDateString('pt-BR');
        if (!acc[date]) {
          acc[date] = { date, conversions: 0, pageViews: 0 };
        }
        if (conv.event_type === 'page_view') {
          acc[date].pageViews++;
        } else {
          acc[date].conversions++;
        }
        return acc;
      }, {});

      // Top pages
      const pageStats = conversions?.reduce((acc: any, conv) => {
        if (!acc[conv.page_path]) {
          acc[conv.page_path] = { path: conv.page_path, conversions: 0, pageViews: 0 };
        }
        if (conv.event_type === 'page_view') {
          acc[conv.page_path].pageViews++;
        } else {
          acc[conv.page_path].conversions++;
        }
        return acc;
      }, {});

      const topPages = Object.values(pageStats || {})
        .sort((a: any, b: any) => b.conversions - a.conversions)
        .slice(0, 10);

      return {
        totalSites: sites?.length || 0,
        totalPages,
        totalConversions,
        pageViews,
        conversionRate,
        monthlyRevenue,
        dailyStats: Object.values(dailyStats || {}),
        topPages,
        sites: sites || [],
        conversions: conversions || [],
      };
    },
    enabled: !!clientId,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['client-saved-reports', clientId],
    queryFn: async () => {
      const { data: sites } = await supabase
        .from('rank_rent_sites')
        .select('id')
        .eq('client_id', clientId);

      if (!sites || sites.length === 0) return [];

      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .in('site_id', sites.map(s => s.id))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  return {
    analytics,
    reports,
    isLoading: analyticsLoading || reportsLoading,
  };
};

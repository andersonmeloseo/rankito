import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const useClientPortalAnalytics = (clientId: string, periodDays: number = 30) => {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['client-portal-analytics', clientId, periodDays],
    queryFn: async () => {
      console.log('[Analytics] Fetching data for client:', clientId, 'period:', periodDays);

      // Fetch client sites
      const { data: sites, error: sitesError } = await supabase
        .from('rank_rent_sites')
        .select(`
          *,
          rank_rent_pages(*)
        `)
        .eq('client_id', clientId);

      if (sitesError) {
        console.error('[Analytics] Error fetching sites:', sitesError);
        throw sitesError;
      }

      console.log('[Analytics] Sites found:', sites?.length || 0);

      const siteIds = sites?.map(s => s.id) || [];
      
      // Return empty data structure if no sites
      if (siteIds.length === 0) {
        console.log('[Analytics] No sites found, returning empty data');
        return {
          totalSites: 0,
          totalPages: 0,
          totalConversions: 0,
          pageViews: 0,
          conversionRate: 0,
          monthlyRevenue: 0,
          dailyStats: [],
          topPages: [],
          sites: [],
          conversions: [],
          deviceStats: [],
          geoStats: [],
          hourlyStats: [],
          isEmpty: true,
        };
      }

      const startDate = startOfDay(subDays(new Date(), periodDays));
      const endDate = endOfDay(new Date());

      // Fetch conversions
      const { data: conversions, error: conversionsError } = await supabase
        .from('rank_rent_conversions')
        .select('*')
        .in('site_id', siteIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversionsError) {
        console.error('[Analytics] Error fetching conversions:', conversionsError);
        throw conversionsError;
      }

      console.log('[Analytics] Conversions found:', conversions?.length || 0);

      // Calculate metrics
      const totalPages = sites?.reduce((acc, s) => acc + (s.rank_rent_pages?.length || 0), 0) || 0;
      const totalConversions = conversions?.filter(c => c.event_type !== 'page_view').length || 0;
      const pageViews = conversions?.filter(c => c.event_type === 'page_view').length || 0;
      const conversionRate = pageViews > 0 ? ((totalConversions / pageViews) * 100) : 0;
      
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

      // Group by hour for heatmap
      const hourlyStats = conversions?.reduce((acc: any, conv) => {
        const hour = new Date(conv.created_at).getHours();
        const dayOfWeek = new Date(conv.created_at).getDay();
        const key = `${dayOfWeek}-${hour}`;
        if (!acc[key]) {
          acc[key] = { hour, dayOfWeek, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {});

      // Group by device/user_agent
      const deviceStats = conversions?.reduce((acc: any, conv) => {
        const ua = conv.user_agent || 'Unknown';
        let device = 'Desktop';
        if (ua.includes('Mobile')) device = 'Mobile';
        if (ua.includes('Tablet')) device = 'Tablet';
        
        if (!acc[device]) {
          acc[device] = { device, count: 0 };
        }
        acc[device].count++;
        return acc;
      }, {});

      // Group by location
      const geoStats = conversions?.reduce((acc: any, conv) => {
        const city = conv.city || 'Unknown';
        const region = conv.region || 'Unknown';
        const key = `${city}, ${region}`;
        
        if (!acc[key]) {
          acc[key] = { location: key, city, region, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {});

      // Top pages with more details
      const pageStats = conversions?.reduce((acc: any, conv) => {
        if (!acc[conv.page_path]) {
          acc[conv.page_path] = { 
            path: conv.page_path, 
            url: conv.page_url,
            conversions: 0, 
            pageViews: 0,
            conversionRate: 0 
          };
        }
        if (conv.event_type === 'page_view') {
          acc[conv.page_path].pageViews++;
        } else {
          acc[conv.page_path].conversions++;
        }
        return acc;
      }, {});

      // Calculate conversion rate per page
      const topPages = Object.values(pageStats || {}).map((p: any) => ({
        ...p,
        conversionRate: p.pageViews > 0 ? ((p.conversions / p.pageViews) * 100) : 0
      }))
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
        hourlyStats: Object.values(hourlyStats || {}),
        deviceStats: Object.values(deviceStats || {}),
        geoStats: Object.values(geoStats || {}).sort((a: any, b: any) => b.count - a.count).slice(0, 10),
        topPages,
        sites: sites || [],
        conversions: conversions || [],
        isEmpty: false,
      };
    },
    enabled: !!clientId,
    refetchInterval: 60000, // Refetch every minute
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

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import React from 'react';

export const useClientPortalAnalytics = (clientId: string, periodDays: number = 30, siteId?: string) => {
  console.log('[Analytics] 🚀 Iniciando query com:', {
    clientId,
    siteId,
    isEnabled: !!clientId && clientId !== 'undefined' && clientId !== 'null',
    periodDays
  });
  
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['client-portal-analytics', clientId, periodDays, siteId],
    queryFn: async () => {
      // Validação crítica do clientId
      if (!clientId || clientId === 'undefined' || clientId === 'null') {
        console.error('[Analytics] Client ID inválido:', clientId);
        throw new Error('Client ID inválido');
      }

      console.log('[Analytics] 🚀 Fetching data for client:', clientId, 'period:', periodDays, 'siteId:', siteId);

      // Fetch client sites with optional filtering by siteId
      let sitesQuery = supabase
        .from('rank_rent_sites')
        .select(`
          *,
          rank_rent_pages(*)
        `)
        .eq('client_id', clientId);

      // If siteId is provided, filter by it
      if (siteId) {
        sitesQuery = sitesQuery.eq('id', siteId);
      }

      const { data: sites, error: sitesError } = await sitesQuery;

      if (sitesError) {
        console.error('[Analytics] Error fetching sites:', sitesError);
        throw sitesError;
      }

      console.log('[Analytics] Sites found:', sites?.length || 0, 'filtered by siteId:', !!siteId);

      const siteIds = sites?.map(s => s.id) || [];
      
      // Return empty data structure if no sites
      if (siteIds.length === 0) {
        console.log('[Analytics] ⚠️ No sites found for client:', clientId);
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

      console.log('[Analytics] 📊 Top Pages calculadas:', {
        topPagesCount: topPages.length,
        sample: topPages[0],
        allPaths: topPages.map(p => p.path).slice(0, 5)
      });

      // NEW: Conversions by type
      const conversionsByType = conversions?.reduce((acc: any, conv) => {
        if (conv.event_type !== 'page_view') {
          acc[conv.event_type] = (acc[conv.event_type] || 0) + 1;
        }
        return acc;
      }, {
        whatsapp_click: 0,
        phone_click: 0,
        email_click: 0,
        form_submit: 0,
      });

      // NEW: Conversions by day with types
      const conversionsByDay = conversions?.reduce((acc: any, conv) => {
        if (conv.event_type !== 'page_view') {
          const date = new Date(conv.created_at).toLocaleDateString('pt-BR');
          if (!acc[date]) {
            acc[date] = { date, whatsapp_click: 0, phone_click: 0, email_click: 0, form_submit: 0, total: 0 };
          }
          acc[date][conv.event_type] = (acc[date][conv.event_type] || 0) + 1;
          acc[date].total++;
        }
        return acc;
      }, {});

      // NEW: Top conversion pages
      const topConversionPages = Object.values(pageStats || {})
        .filter((p: any) => p.conversions > 0)
        .sort((a: any, b: any) => b.conversions - a.conversions)
        .slice(0, 10);

      // NEW: Top page views
      const topPageViews = Object.values(pageStats || {})
        .sort((a: any, b: any) => b.pageViews - a.pageViews)
        .slice(0, 10);

      // NEW: Unique visitors and unique pages
      const uniqueVisitors = new Set(conversions?.map(c => c.ip_address).filter(Boolean)).size;
      const uniquePages = Object.keys(pageStats || {}).length;

      // NEW: Sparkline data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('pt-BR');
      });

      const sparklineData = {
        pageViews: last7Days.map(date => {
          const dayData = dailyStats?.[date];
          return dayData?.pageViews || 0;
        }),
        conversions: last7Days.map(date => {
          const dayData = dailyStats?.[date];
          return dayData?.conversions || 0;
        }),
      };

      // NEW: Previous period for comparison
      const previousStartDate = startOfDay(subDays(startDate, periodDays));
      const { data: previousConversions } = await supabase
        .from('rank_rent_conversions')
        .select('event_type')
        .in('site_id', siteIds)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const previousTotalConversions = previousConversions?.filter(c => c.event_type !== 'page_view').length || 0;
      const previousPageViews = previousConversions?.filter(c => c.event_type === 'page_view').length || 0;
      const previousConversionRate = previousPageViews > 0 ? ((previousTotalConversions / previousPageViews) * 100) : 0;

      // NEW: Top referrers
      const topReferrers = conversions?.reduce((acc: any, conv) => {
        const referrer = conv.referrer || 'Direto';
        if (!acc[referrer]) {
          acc[referrer] = { referrer, count: 0 };
        }
        acc[referrer].count++;
        return acc;
      }, {});

      const totalReferrers = conversions?.length || 1;
      const topReferrersList = Object.values(topReferrers || {})
        .map((r: any) => ({
          ...r,
          percentage: (r.count / totalReferrers) * 100
        }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

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
        
        // NEW DATA
        conversionsByType,
        conversionsByDay: Object.values(conversionsByDay || {}),
        topConversionPages,
        topPageViews,
        uniqueVisitors,
        uniquePages,
        sparklineData,
        previousPeriodMetrics: {
          uniqueVisitors: 0, // Would need to calculate from previous period
          uniquePages: 0,
          pageViews: previousPageViews,
          conversions: previousTotalConversions,
          conversionRate: previousConversionRate,
        },
        topReferrers: topReferrersList,
      };
    },
    enabled: !!clientId && clientId !== 'undefined' && clientId !== 'null' && clientId !== '',
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
    retryDelay: 1000,
  });

  React.useEffect(() => {
    if (analytics) {
      console.log('[Analytics] 📊 Dados carregados:', {
        totalSites: analytics.totalSites,
        totalConversions: analytics.totalConversions,
        pageViews: analytics.pageViews,
        isEmpty: analytics.isEmpty
      });
    }
  }, [analytics]);

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['client-saved-reports', clientId],
    queryFn: async () => {
      // Buscar relatórios compartilhados diretamente com este cliente
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('[Analytics] 📄 Relatórios compartilhados:', data?.length || 0);
      
      return data;
    },
    enabled: !!clientId,
  });

  console.log('[Analytics] ✅ Retornando dados:', {
    hasAnalytics: !!analytics,
    isEmpty: analytics?.isEmpty,
    totalConversions: analytics?.totalConversions,
    clientId
  });

  return {
    analytics,
    reports,
    isLoading: analyticsLoading || reportsLoading,
    error: analyticsError,
  };
};

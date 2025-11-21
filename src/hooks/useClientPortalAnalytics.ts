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
      console.log('[Analytics] 🔍 Query resultados:', {
        totalConversions: conversions?.length,
        ecommerceCount: conversions?.filter(c => c.is_ecommerce_event).length,
        siteIds,
        dateRange: { start: startDate, end: endDate }
      });

      // Calculate metrics
      const totalPages = sites?.reduce((acc, s) => acc + (s.rank_rent_pages?.length || 0), 0) || 0;
      const totalConversions = conversions?.filter(c => c.event_type !== 'page_view').length || 0;
      const pageViews = conversions?.filter(c => c.event_type === 'page_view').length || 0;
      const conversionRate = pageViews > 0 ? ((totalConversions / pageViews) * 100) : 0;
      
      // Monthly revenue
      const monthlyRevenue = sites?.reduce((acc, s) => acc + (Number(s.monthly_rent_value) || 0), 0) || 0;

      // Group conversions by day
      const dailyStats = conversions?.reduce((acc: any, conv) => {
        const date = new Date(conv.created_at).toISOString().split('T')[0]; // YYYY-MM-DD format
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

    // Group by device from metadata (only page_views)
    const deviceStats = conversions
      ?.filter((conv) => conv.event_type === 'page_view')
      ?.reduce((acc: any, conv) => {
        const metadata = conv.metadata as any;
        const deviceRaw = metadata?.device || 'desktop';
        const device = deviceRaw.charAt(0).toUpperCase() + deviceRaw.slice(1);
        
        if (!acc[device]) {
          acc[device] = { device, count: 0 };
        }
        acc[device].count++;
        return acc;
      }, {});

      // ✅ LOG DE DIAGNÓSTICO 1: Após cálculo de deviceStats
      console.log('🔍 [useClientPortalAnalytics] deviceStats calculado:', {
        deviceStats,
        asArray: Object.values(deviceStats || {}),
        totalConversions: conversions?.filter(c => c.event_type === 'page_view').length
      });

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
          const date = new Date(conv.created_at).toISOString().split('T')[0]; // YYYY-MM-DD format
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

      // E-commerce data processing - Buscar de TODOS os sites do cliente
      const ecommerceEvents = conversions?.filter(c => c.is_ecommerce_event) || [];
      
      console.log('[Analytics] 🛒 E-commerce events total:', {
        totalConversions: conversions?.length,
        ecommerceEventsCount: ecommerceEvents.length,
        siteIds: siteIds,
        eventTypes: ecommerceEvents.map(e => e.event_type)
      });
      
      const ecommerce = ecommerceEvents.length > 0 ? (() => {
        const purchases = ecommerceEvents.filter(e => e.event_type === 'purchase');
        const totalRevenue = purchases.reduce((sum, p) => {
          const metadata = p.metadata as any;
          return sum + (parseFloat(metadata?.revenue || '0'));
        }, 0);
        
        const totalOrders = purchases.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const productViews = ecommerceEvents.filter(e => e.event_type === 'product_view').length;
        const addToCarts = ecommerceEvents.filter(e => e.event_type === 'add_to_cart').length;
        const checkouts = ecommerceEvents.filter(e => e.event_type === 'begin_checkout').length;
        const conversionRate = productViews > 0 ? (totalOrders / productViews) * 100 : 0;
        
        // Product aggregation
        const productMap = new Map<string, any>();
        ecommerceEvents.forEach(event => {
          const metadata = event.metadata as any;
          const productName = metadata?.product_name || 'Produto Desconhecido';
          const pageUrl = event.page_url || '';
          
          if (!productMap.has(productName)) {
            productMap.set(productName, { productName, purchases: 0, revenue: 0, productUrl: '' });
          }
          
          const product = productMap.get(productName)!;
          if (event.event_type === 'purchase' && pageUrl) product.productUrl = pageUrl;
          if (event.event_type === 'purchase') {
            product.purchases++;
            product.revenue += parseFloat(metadata?.revenue || '0');
          }
        });
        
        const topProducts = Array.from(productMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
        
        // Revenue evolution
        const revenueByDay = purchases.reduce((acc: any, p) => {
          const date = new Date(p.created_at).toISOString().split('T')[0];
          if (!acc[date]) acc[date] = { date, revenue: 0, orders: 0 };
          const metadata = p.metadata as any;
          acc[date].revenue += parseFloat(metadata?.revenue || '0');
          acc[date].orders++;
          return acc;
        }, {});
        
        return {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          conversionRate,
          topProducts,
          revenueEvolution: Object.values(revenueByDay),
          funnel: {
            productViews,
            addToCarts,
            checkouts,
            purchases: totalOrders,
            viewToCartRate: productViews > 0 ? (addToCarts / productViews) * 100 : 0,
            cartToCheckoutRate: addToCarts > 0 ? (checkouts / addToCarts) * 100 : 0,
            checkoutToSaleRate: checkouts > 0 ? (totalOrders / checkouts) * 100 : 0,
          }
        };
      })() : null;

      console.log('[Analytics] 🛒 E-commerce processado:', {
        ecommerceEventsCount: ecommerceEvents.length,
        hasEcommerce: !!ecommerce,
        ecommerceData: ecommerce
      });

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
          uniqueVisitors: 0,
          uniquePages: 0,
          pageViews: previousPageViews,
          conversions: previousTotalConversions,
          conversionRate: previousConversionRate,
        },
        topReferrers: topReferrersList,
        ecommerce,
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

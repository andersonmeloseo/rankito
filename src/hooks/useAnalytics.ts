import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

interface UseAnalyticsParams {
  siteId: string;
  period: string;
  eventType: string;
  device: string;
  customStartDate?: Date;
  customEndDate?: Date;
}

export const useAnalytics = ({
  siteId,
  period,
  eventType,
  device,
  customStartDate,
  customEndDate,
}: UseAnalyticsParams) => {
  
  const getDatesFromPeriod = () => {
    if (period === "custom" && customStartDate && customEndDate) {
      return {
        startDate: startOfDay(customStartDate).toISOString(),
        endDate: endOfDay(customEndDate).toISOString(),
      };
    }
    
    const days = parseInt(period);
    const endDate = endOfDay(new Date()).toISOString();
    const startDate = startOfDay(subDays(new Date(), days)).toISOString();
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDatesFromPeriod();

  // Calcular período anterior para comparação
  const getPreviousPeriodDates = () => {
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const diffDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const previousEnd = startOfDay(subDays(currentStart, 1)).toISOString();
    const previousStart = startOfDay(subDays(currentStart, diffDays)).toISOString();
    
    return { previousStart, previousEnd };
  };

  const { previousStart, previousEnd } = getPreviousPeriodDates();

  // Métricas principais
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["analytics-metrics", siteId, startDate, endDate, eventType, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("*", { count: "exact" })
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (eventType !== "all") {
        query = query.eq("event_type", eventType as any);
      }

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const pageViews = data?.filter(d => d.event_type === "page_view").length || 0;
      const conversions = data?.filter(d => d.event_type !== "page_view").length || 0;
      
      // Unique visitors (aproximação por IP)
      const uniqueIps = new Set(data?.map(d => d.ip_address));
      const uniqueVisitors = uniqueIps.size;
      
      const conversionRate = pageViews > 0 ? (conversions / pageViews * 100).toFixed(2) : "0.00";

      return {
        uniqueVisitors,
        pageViews,
        conversions,
        conversionRate,
        totalEvents: count || 0,
      };
    },
    enabled: !!siteId,
  });

  // Timeline (últimos N dias)
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["analytics-timeline", siteId, startDate, endDate, eventType, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("created_at, event_type")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (eventType !== "all") {
        query = query.eq("event_type", eventType as any);
      }

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por dia
      const grouped = data?.reduce((acc: any, conv) => {
        const date = new Date(conv.created_at).toLocaleDateString("pt-BR");
        if (!acc[date]) {
          acc[date] = { date, pageViews: 0, conversions: 0 };
        }
        if (conv.event_type === "page_view") {
          acc[date].pageViews++;
        } else {
          acc[date].conversions++;
        }
        return acc;
      }, {});

      return Object.values(grouped || {}).sort((a: any, b: any) => 
        new Date(a.date.split("/").reverse().join("-")).getTime() - 
        new Date(b.date.split("/").reverse().join("-")).getTime()
      );
    },
    enabled: !!siteId,
  });

  // Distribuição de eventos
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["analytics-events", siteId, startDate, endDate, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("event_type")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      const { data, error } = await query;
      if (error) throw error;

      const grouped = data?.reduce((acc: any, conv) => {
        acc[conv.event_type] = (acc[conv.event_type] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped || {}).map(([name, value]) => ({
        name: name.replace("_", " ").toUpperCase(),
        value,
      }));
    },
    enabled: !!siteId,
  });

  // Top páginas
  const { data: topPages, isLoading: topPagesLoading } = useQuery({
    queryKey: ["analytics-top-pages", siteId, startDate, endDate, eventType, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("page_path, event_type")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (eventType !== "all") {
        query = query.eq("event_type", eventType as any);
      }

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      const { data, error } = await query;
      if (error) throw error;

      const grouped = data?.reduce((acc: any, conv) => {
        if (!acc[conv.page_path]) {
          acc[conv.page_path] = { path: conv.page_path, count: 0 };
        }
        acc[conv.page_path].count++;
        return acc;
      }, {});

      return Object.values(grouped || {})
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);
    },
    enabled: !!siteId,
  });

  // Métricas do período anterior para comparação
  const { data: previousMetrics } = useQuery({
    queryKey: ["analytics-previous-metrics", siteId, previousStart, previousEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .gte("created_at", previousStart)
        .lte("created_at", previousEnd);

      if (error) throw error;

      const pageViews = data?.filter(d => d.event_type === "page_view").length || 0;
      const conversions = data?.filter(d => d.event_type !== "page_view").length || 0;
      const uniqueIps = new Set(data?.map(d => d.ip_address));
      const uniqueVisitors = uniqueIps.size;
      const conversionRate = pageViews > 0 ? (conversions / pageViews * 100).toFixed(2) : "0.00";

      return { uniqueVisitors, pageViews, conversions, conversionRate };
    },
    enabled: !!siteId,
  });

  // Lista completa de conversões (últimas 100)
  const { data: conversions, isLoading: conversionsLoading, dataUpdatedAt: conversionsUpdatedAt } = useQuery({
    queryKey: ["analytics-conversions", siteId, startDate, endDate, eventType, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .neq("event_type", "page_view")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false })
        .limit(100);

      if (eventType !== "all" && eventType !== "page_view") {
        query = query.eq("event_type", eventType as any);
      }

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('🔍 Conversions Query Result:', {
        total: data?.length || 0,
        types: data?.map(d => d.event_type),
        hasPageViews: data?.some(d => d.event_type === 'page_view'),
        sample: data?.[0],
        returningData: !!data,
        isEmptyArray: Array.isArray(data) && data.length === 0,
        isUndefined: data === undefined
      });

      return data;
    },
    enabled: !!siteId,
  });

  // Lista de page views separada
  const { data: pageViewsList, isLoading: pageViewsLoading, dataUpdatedAt: pageViewsUpdatedAt } = useQuery({
    queryKey: ["analytics-page-views", siteId, startDate, endDate, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .eq("event_type", "page_view")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false })
        .limit(100);

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('📄 Page Views Query Result:', {
        total: data?.length || 0,
        types: data?.map(d => d.event_type),
        allPageViews: data?.every(d => d.event_type === 'page_view'),
        sample: data?.[0],
        returningData: !!data,
        isEmptyArray: Array.isArray(data) && data.length === 0,
        isUndefined: data === undefined
      });

      return data;
    },
    enabled: !!siteId,
  });

  // Dados para funil de conversão
  const { data: funnelData } = useQuery({
    queryKey: ["analytics-funnel", siteId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("event_type")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) throw error;

      const pageViews = data?.filter(d => d.event_type === "page_view").length || 0;
      const conversions = data?.filter(d => d.event_type !== "page_view").length || 0;
      const interactions = conversions; // Para simplificar

      return { pageViews, interactions, conversions };
    },
    enabled: !!siteId,
  });

  // Heatmap por hora do dia
  const { data: hourlyData } = useQuery({
    queryKey: ["analytics-hourly", siteId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("created_at")
        .eq("site_id", siteId)
        .neq("event_type", "page_view")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) throw error;

      const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
      
      data?.forEach(conv => {
        const hour = new Date(conv.created_at).getHours();
        hourCounts[hour].count++;
      });

      return hourCounts;
    },
    enabled: !!siteId,
  });

  // Sparkline data (últimos 7 dias)
  const { data: sparklineData } = useQuery({
    queryKey: ["analytics-sparkline", siteId],
    queryFn: async () => {
      const last7Days = startOfDay(subDays(new Date(), 7)).toISOString();
      const now = endOfDay(new Date()).toISOString();

      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("created_at, event_type")
        .eq("site_id", siteId)
        .gte("created_at", last7Days)
        .lte("created_at", now);

      if (error) throw error;

      const dailyCounts = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = date.toISOString().split('T')[0];
        return {
          pageViews: 0,
          conversions: 0,
          date: dateStr
        };
      });

      data?.forEach(conv => {
        const dateStr = new Date(conv.created_at).toISOString().split('T')[0];
        const dayIndex = dailyCounts.findIndex(d => d.date === dateStr);
        if (dayIndex !== -1) {
          if (conv.event_type === "page_view") {
            dailyCounts[dayIndex].pageViews++;
          } else {
            dailyCounts[dayIndex].conversions++;
          }
        }
      });

      return {
        pageViews: dailyCounts.map(d => d.pageViews),
        conversions: dailyCounts.map(d => d.conversions),
      };
    },
    enabled: !!siteId,
  });

  // Conversion rate over time
  const { data: conversionRateData } = useQuery({
    queryKey: ["analytics-conversion-rate", siteId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("created_at, event_type")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) throw error;

      const dailyStats: Record<string, { pageViews: number; conversions: number }> = {};
      
      data?.forEach(conv => {
        const dateStr = new Date(conv.created_at).toISOString().split('T')[0];
        
        if (!dailyStats[dateStr]) {
          dailyStats[dateStr] = { pageViews: 0, conversions: 0 };
        }

        if (conv.event_type === "page_view") {
          dailyStats[dateStr].pageViews++;
        } else {
          dailyStats[dateStr].conversions++;
        }
      });

      return Object.entries(dailyStats)
        .map(([date, stats]) => ({
          date,
          rate: stats.pageViews > 0 ? (stats.conversions / stats.pageViews) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!siteId,
  });

  // Timeline comparativa de Page Views
  const { data: pageViewsTimeline, isLoading: pageViewsTimelineLoading } = useQuery({
    queryKey: ["analytics-pageviews-timeline", siteId, startDate, endDate, device],
    queryFn: async () => {
      let currentQuery = supabase
        .from("rank_rent_conversions")
        .select("created_at")
        .eq("site_id", siteId)
        .eq("event_type", "page_view")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      let previousQuery = supabase
        .from("rank_rent_conversions")
        .select("created_at")
        .eq("site_id", siteId)
        .eq("event_type", "page_view")
        .gte("created_at", previousStart)
        .lte("created_at", previousEnd);

      if (device !== "all") {
        currentQuery = currentQuery.filter('metadata->>device', 'eq', device);
        previousQuery = previousQuery.filter('metadata->>device', 'eq', device);
      }

      const [{ data: currentData }, { data: previousData }] = await Promise.all([
        currentQuery,
        previousQuery,
      ]);

      const currentStats: Record<string, number> = {};
      const previousStats: Record<string, number> = {};

      currentData?.forEach(pv => {
        const dateStr = new Date(pv.created_at).toISOString().split('T')[0];
        currentStats[dateStr] = (currentStats[dateStr] || 0) + 1;
      });

      previousData?.forEach(pv => {
        const dateStr = new Date(pv.created_at).toISOString().split('T')[0];
        previousStats[dateStr] = (previousStats[dateStr] || 0) + 1;
      });

      const allDates = new Set([...Object.keys(currentStats), ...Object.keys(previousStats)]);
      return Array.from(allDates)
        .map(date => ({
          date,
          current: currentStats[date] || 0,
          previous: previousStats[date] || 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!siteId,
  });

  // Top Referrers
  const { data: topReferrers, isLoading: topReferrersLoading } = useQuery({
    queryKey: ["analytics-top-referrers", siteId, startDate, endDate, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("referrer")
        .eq("site_id", siteId)
        .eq("event_type", "page_view")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      const { data, error } = await query;
      if (error) throw error;

      const referrerCounts: Record<string, number> = {};
      data?.forEach(pv => {
        const ref = pv.referrer || "Direto";
        referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
      });

      const total = Object.values(referrerCounts).reduce((sum, count) => sum + count, 0);

      return Object.entries(referrerCounts)
        .map(([referrer, count]) => ({
          referrer: referrer.length > 40 ? referrer.substring(0, 40) + "..." : referrer,
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!siteId,
  });

  // Page Performance (views + conversions por página)
  const { data: pagePerformance, isLoading: pagePerformanceLoading } = useQuery({
    queryKey: ["analytics-page-performance", siteId, startDate, endDate, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("page_path, event_type")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      const { data, error } = await query;
      if (error) throw error;

      const pageStats: Record<string, { views: number; conversions: number }> = {};
      
      data?.forEach(conv => {
        if (!pageStats[conv.page_path]) {
          pageStats[conv.page_path] = { views: 0, conversions: 0 };
        }
        if (conv.event_type === "page_view") {
          pageStats[conv.page_path].views++;
        } else {
          pageStats[conv.page_path].conversions++;
        }
      });

      return Object.entries(pageStats)
        .map(([page, stats]) => ({
          page: page.length > 30 ? page.substring(0, 30) + "..." : page,
          views: stats.views,
          conversions: stats.conversions,
          conversionRate: stats.views > 0 ? (stats.conversions / stats.views) * 100 : 0,
        }))
        .sort((a, b) => b.views - a.views);
    },
    enabled: !!siteId,
  });

  // Conversions timeline (agrupado por data + tipo)
  const conversionsTimeline = conversions?.reduce((acc: any[], conv: any) => {
    const dateObj = new Date(conv.created_at);
    const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
    
    let existing = acc.find(item => item.date === dateStr);
    
    if (!existing) {
      existing = {
        date: dateStr,
        whatsapp_click: 0,
        phone_click: 0,
        email_click: 0,
        form_submit: 0,
        total: 0,
      };
      acc.push(existing);
    }
    
    if (conv.event_type === 'whatsapp_click') existing.whatsapp_click++;
    else if (conv.event_type === 'phone_click') existing.phone_click++;
    else if (conv.event_type === 'email_click') existing.email_click++;
    else if (conv.event_type === 'form_submit') existing.form_submit++;
    
    existing.total++;
    
    return acc;
  }, []) || [];

  // Top Conversion Pages
  const topConversionPages = conversions?.reduce((acc: any[], conv: any) => {
    const page = conv.page_path || '/';
    const existing = acc.find(item => item.page === page);
    
    if (existing) {
      existing.conversions += 1;
    } else {
      acc.push({ page, conversions: 1 });
    }
    
    return acc;
  }, [])
    .sort((a: any, b: any) => b.conversions - a.conversions)
    .slice(0, 10) || [];

  // Conversion Type Distribution
  const conversionTypeDistribution = conversions?.reduce((acc: Record<string, number>, conv: any) => {
    const type = conv.event_type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conversionTypeDistributionArray = conversionTypeDistribution 
    ? Object.entries(conversionTypeDistribution).map(([type, count]) => {
        const total = conversions?.length || 1;
        const typeLabel = type === 'whatsapp_click' ? 'WhatsApp' 
          : type === 'phone_click' ? 'Telefone'
          : type === 'email_click' ? 'Email'
          : type === 'form_submit' ? 'Formulário'
          : type;
        
        return {
          name: typeLabel,
          value: count,
          percentage: ((count / total) * 100).toFixed(1)
        };
      })
    : [];

  // Conversion Hourly Data (usa o hourlyData existente mas adaptado)
  const conversionHourlyData = conversions?.reduce((acc: Record<string, number>, conv: any) => {
    const date = new Date(conv.created_at);
    const hour = date.getHours();
    const day = date.getDay();
    const key = `${day}-${hour}`;
    
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const isLoading =
    metricsLoading || 
    timelineLoading || 
    eventsLoading || 
    topPagesLoading || 
    conversionsLoading ||
    pageViewsLoading ||
    pageViewsTimelineLoading ||
    topReferrersLoading ||
    pagePerformanceLoading;

  return {
    metrics,
    previousMetrics,
    timeline,
    events,
    topPages,
    conversions,
    pageViewsList,
    funnelData,
    hourlyData,
    sparklineData,
    conversionRateData,
    pageViewsTimeline,
    topReferrers,
    pagePerformance,
    conversionsTimeline,
    topConversionPages,
    conversionTypeDistribution: conversionTypeDistributionArray,
    conversionHourlyData,
    conversionsUpdatedAt,
    pageViewsUpdatedAt,
    isLoading,
  };
};

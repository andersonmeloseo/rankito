import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { useMemo } from "react";
import { isConversionEvent } from "@/lib/conversionUtils";

/**
 * Helper function to fetch all records bypassing Supabase 1000-record limit
 * Uses pagination with multiple .range() calls until all data is retrieved
 */
async function fetchAllPaginated<T>(
  queryBuilder: any,
  pageSize: number = 1000
): Promise<T[]> {
  let allData: T[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await queryBuilder.range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allData = [...allData, ...data];
    
    // Se retornou menos que pageSize, é a última página
    if (data.length < pageSize) break;
    
    offset += pageSize;
  }
  
  return allData;
}

interface UseAnalyticsParams {
  siteId: string;
  period: string;
  eventType: string;
  device: string;
  conversionType: string;
  customStartDate?: Date;
  customEndDate?: Date;
}

export const useAnalytics = ({
  siteId,
  period,
  eventType,
  device,
  conversionType,
  customStartDate,
  customEndDate,
}: UseAnalyticsParams) => {
  
  // Usar useMemo para garantir recálculo quando período muda
  const { startDate, endDate } = useMemo(() => {
    if (period === "all") {
      return {
        startDate: new Date("2020-01-01").toISOString(),
        endDate: endOfDay(new Date()).toISOString(),
      };
    }
    
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
  }, [period, customStartDate, customEndDate]);

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
    queryKey: ["analytics-metrics", siteId, startDate, endDate, eventType, device, conversionType, period],
    queryFn: async () => {
      // LOGGING DE DEBUG
      console.log('📊 Metrics Query Debug:', {
        period,
        startDate,
        endDate,
        siteId,
        eventType,
        device,
        conversionType
      });
      
      // Query base com filtros
      const baseFilters = {
        site_id: siteId,
        ...(eventType !== "all" && { event_type: eventType }),
        ...(conversionType === "ecommerce" && { is_ecommerce_event: true }),
        ...(conversionType === "normal" && { is_ecommerce_event: false }),
      };

      // 1. Visitantes únicos (buscar TODOS os IPs com paginação)
      let uniqueVisitorsQuery = supabase
        .from("rank_rent_conversions")
        .select("ip_address", { head: false })
        .match(baseFilters)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        uniqueVisitorsQuery = uniqueVisitorsQuery.filter('metadata->>device', 'eq', device);
      }
      
      if (conversionType === "ecommerce") {
        uniqueVisitorsQuery = uniqueVisitorsQuery.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        uniqueVisitorsQuery = uniqueVisitorsQuery.eq("is_ecommerce_event", false);
      }

      // USAR PAGINAÇÃO para buscar TODOS os registros!
      const ipsData = await fetchAllPaginated<{ ip_address: string }>(uniqueVisitorsQuery);
      const uniqueVisitors = new Set(ipsData?.map(d => d.ip_address)).size;

      // 2. Páginas únicas (buscar TODOS os paths com paginação)
      let uniquePagesQuery = supabase
        .from("rank_rent_conversions")
        .select("page_path", { head: false })
        .match(baseFilters)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        uniquePagesQuery = uniquePagesQuery.filter('metadata->>device', 'eq', device);
      }
      
      if (conversionType === "ecommerce") {
        uniquePagesQuery = uniquePagesQuery.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        uniquePagesQuery = uniquePagesQuery.eq("is_ecommerce_event", false);
      }

      // USAR PAGINAÇÃO para buscar TODOS os registros!
      const pagesData = await fetchAllPaginated<{ page_path: string }>(uniquePagesQuery);
      const uniquePages = new Set(pagesData?.map(d => d.page_path)).size;

      // 3. Page views (usar count para melhor performance)
      let pageViewsQuery = supabase
        .from("rank_rent_conversions")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("event_type", "page_view")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        pageViewsQuery = pageViewsQuery.filter('metadata->>device', 'eq', device);
      }
      
      if (conversionType === "ecommerce") {
        pageViewsQuery = pageViewsQuery.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        pageViewsQuery = pageViewsQuery.eq("is_ecommerce_event", false);
      }

      const { count: pageViews, error: pvError } = await pageViewsQuery;
      if (pvError) throw pvError;

      // 4. Conversões (usar count para melhor performance)
      let conversionsQuery = supabase
        .from("rank_rent_conversions")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .neq("event_type", "page_view")
        .neq("event_type", "page_exit")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (eventType !== "all" && eventType !== "page_view") {
        conversionsQuery = conversionsQuery.eq("event_type", eventType as any);
      }

      if (device !== "all") {
        conversionsQuery = conversionsQuery.filter('metadata->>device', 'eq', device);
      }
      
      if (conversionType === "ecommerce") {
        conversionsQuery = conversionsQuery.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        conversionsQuery = conversionsQuery.eq("is_ecommerce_event", false);
      }

      const { count: conversions, error: convError } = await conversionsQuery;
      if (convError) throw convError;

      const conversionRate = (pageViews || 0) > 0 
        ? ((conversions || 0) / (pageViews || 0) * 100).toFixed(2) 
        : "0.00";

      // LOGGING DE DEBUG - PAGINAÇÃO FUNCIONANDO! 🎉
      console.log('📊 Metrics Query Result (PAGINATED):', {
        uniqueVisitors,
        uniquePages,
        pageViews,
        conversions,
        ipsDataLength: ipsData?.length,  // Agora deve mostrar > 1000! 🚀
        pagesDataLength: pagesData?.length, // Agora deve mostrar > 1000! 🚀
        paginationWorked: ipsData?.length > 1000 || pagesData?.length > 1000 
          ? '✅ PAGINAÇÃO FUNCIONANDO!' 
          : 'ℹ️ Menos de 1000 registros',
        startDate,
        endDate
      });

      return {
        uniqueVisitors,
        uniquePages,
        pageViews: pageViews || 0,
        conversions: conversions || 0,
        conversionRate,
        totalEvents: (pageViews || 0) + (conversions || 0),
      };
    },
    enabled: !!siteId,
    staleTime: 0, // Garantir refetch quando queryKey muda
    gcTime: 0,    // Não manter cache em memória
  });

  // Timeline (últimos N dias)
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["analytics-timeline", siteId, startDate, endDate, eventType, device, conversionType],
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

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      // Usar paginação para buscar todos os registros (> 1000)
      const data = await fetchAllPaginated<{ created_at: string; event_type: string }>(query);

      // Agrupar por dia
      const grouped = data?.reduce((acc: any, conv) => {
        const date = new Date(conv.created_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, pageViews: 0, conversions: 0 };
        }
        if (conv.event_type === "page_view") {
          acc[date].pageViews++;
        } else if (isConversionEvent(conv.event_type)) {
          acc[date].conversions++;
        }
        return acc;
      }, {});

      return Object.values(grouped || {}).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    enabled: !!siteId,
  });

  // Distribuição de eventos
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["analytics-events", siteId, startDate, endDate, device, conversionType],
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

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      // Usar paginação para buscar todos os registros (> 1000)
      const data = await fetchAllPaginated<{ event_type: string }>(query);

      const eventCounts: Record<string, number> = {};
      data?.forEach(conv => {
        eventCounts[conv.event_type] = (eventCounts[conv.event_type] || 0) + 1;
      });

      return Object.entries(eventCounts).map(([event_type, count]) => ({
        name: event_type.replace(/_/g, " ").toUpperCase(),
        value: count,
      }));
    },
    enabled: !!siteId,
  });

  // Top páginas
  const { data: topPages, isLoading: topPagesLoading } = useQuery({
    queryKey: ["analytics-top-pages", siteId, startDate, endDate, eventType, device, conversionType],
    queryFn: async () => {
      // Se eventType não for 'all', precisamos filtrar no cliente
      // porque a função SQL não suporta esse filtro
      if (eventType !== "all") {
        let query = supabase
          .from("rank_rent_conversions")
          .select("page_path, event_type")
          .eq("site_id", siteId)
          .eq("event_type", eventType as any)
          .gte("created_at", startDate)
          .lte("created_at", endDate);

        if (device !== "all") {
          query = query.filter('metadata->>device', 'eq', device);
        }

        if (conversionType === "ecommerce") {
          query = query.eq("is_ecommerce_event", true);
        } else if (conversionType === "normal") {
          query = query.eq("is_ecommerce_event", false);
        }

        query = query.range(0, 49999);

        const { data, error } = await query;
        if (error) throw error;

        const grouped = data?.reduce((acc: any, conv) => {
          if (!acc[conv.page_path]) {
            acc[conv.page_path] = { page: conv.page_path, count: 0 };
          }
          acc[conv.page_path].count++;
          return acc;
        }, {});

        return Object.values(grouped || {})
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 10);
      }

      // Para 'all', usar query direta com filtro de conversionType
      let query = supabase
        .from("rank_rent_conversions")
        .select("page_path, event_type")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      query = query.range(0, 49999);

      const { data, error } = await query;
      if (error) throw error;

      const grouped = data?.reduce((acc: any, conv) => {
        if (!acc[conv.page_path]) {
          acc[conv.page_path] = { page: conv.page_path, count: 0 };
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
    queryKey: ["analytics-previous-metrics", siteId, previousStart, previousEnd, conversionType],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .gte("created_at", previousStart)
        .lte("created_at", previousEnd);

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      query = query.range(0, 49999);

      const { data, error } = await query;

      if (error) throw error;

      const pageViews = data?.filter(d => d.event_type === "page_view").length || 0;
      const conversions = data?.filter(d => isConversionEvent(d.event_type)).length || 0;
      const uniqueIps = new Set(data?.map(d => d.ip_address));
      const uniqueVisitors = uniqueIps.size;
      const uniquePagePaths = new Set(data?.map(d => d.page_path));
      const uniquePages = uniquePagePaths.size;
      const conversionRate = pageViews > 0 ? (conversions / pageViews * 100).toFixed(2) : "0.00";

      return { uniqueVisitors, uniquePages, pageViews, conversions, conversionRate };
    },
    enabled: !!siteId,
  });

  // Lista completa de conversões (últimas 100, ou todas se período = "all")
  const { data: conversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ["analytics-conversions", siteId, startDate, endDate, eventType, device, conversionType, period],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .neq("event_type", "page_view")
        .neq("event_type", "page_exit")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      // Buscar todas as conversões do período - paginação no frontend
      if (eventType !== "all" && eventType !== "page_view") {
        query = query.eq("event_type", eventType as any);
      }

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
    enabled: !!siteId,
  });

  // Timeline de Conversões - Query dedicada sem limite para gráficos
  const { data: conversionsForTimeline, isLoading: timelineConversionsLoading } = useQuery({
    queryKey: ["analytics-conversions-timeline", siteId, startDate, endDate, device, conversionType],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("created_at, event_type")
        .eq("site_id", siteId)
        .neq("event_type", "page_view")
        .neq("event_type", "page_exit")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .range(0, 49999);

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
    enabled: !!siteId,
  });

  // Lista de page views separada
  const { data: pageViewsList, isLoading: pageViewsLoading } = useQuery({
    queryKey: ["analytics-page-views", siteId, period, startDate, endDate, device, conversionType],
    queryFn: async () => {
      console.log('🔍 PageViewsList Query Debug:', {
        siteId,
        startDate,
        endDate,
        device,
        periodDays: period,
        skipDateFilter: period === "all"
      });

      let query = supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .eq("event_type", "page_view");

      // Aplicar filtros de data APENAS se não for "todo período"
      if (period !== "all") {
        query = query
          .gte("created_at", startDate)
          .lte("created_at", endDate);
      }

      query = query.order("created_at", { ascending: false });

      // Aplicar range apenas se não for "todo período"
      if (period !== "all") {
        query = query.range(0, 49999);
      }

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      const { data, error } = await query;
      
      console.log('🔍 PageViewsList Query Result:', {
        dataCount: data?.length || 0,
        error: error?.message,
        firstRecord: data?.[0],
        lastRecord: data?.[data?.length - 1],
        limitReached: data?.length === 1000
      });

      if (error) throw error;

      return data;
    },
    enabled: !!siteId,
  });

  // Dados para funil de conversão
  const { data: funnelData } = useQuery({
    queryKey: ["analytics-funnel", siteId, startDate, endDate, device, conversionType],
    queryFn: async () => {
      // Query direta para page views
      let pageViewsQuery = supabase
        .from("rank_rent_conversions")
        .select("*", { count: 'exact', head: true })
        .eq("site_id", siteId)
        .eq("event_type", "page_view")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        pageViewsQuery = pageViewsQuery.filter('metadata->>device', 'eq', device);
      }

      if (conversionType === "ecommerce") {
        pageViewsQuery = pageViewsQuery.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        pageViewsQuery = pageViewsQuery.eq("is_ecommerce_event", false);
      }

      // Query direta para conversões
      let conversionsQuery = supabase
        .from("rank_rent_conversions")
        .select("*", { count: 'exact', head: true })
        .eq("site_id", siteId)
        .neq("event_type", "page_view")
        .neq("event_type", "page_exit")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        conversionsQuery = conversionsQuery.filter('metadata->>device', 'eq', device);
      }

      if (conversionType === "ecommerce") {
        conversionsQuery = conversionsQuery.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        conversionsQuery = conversionsQuery.eq("is_ecommerce_event", false);
      }

      const [{ count: pageViews }, { count: conversions }] = await Promise.all([
        pageViewsQuery,
        conversionsQuery,
      ]);

      return {
        pageViews: pageViews || 0,
        interactions: conversions || 0,
        conversions: conversions || 0,
      };
    },
    enabled: !!siteId,
  });

  // Heatmap por hora do dia
  const { data: hourlyData } = useQuery({
    queryKey: ["analytics-hourly", siteId, startDate, endDate, conversionType],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("created_at")
        .eq("site_id", siteId)
        .neq("event_type", "page_view")
        .neq("event_type", "page_exit")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      // Usar paginação para buscar todos os registros (> 1000)
      const data = await fetchAllPaginated<{ created_at: string }>(query);

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
    queryKey: ["analytics-sparkline", siteId, conversionType],
    queryFn: async () => {
      const last7Days = startOfDay(subDays(new Date(), 7)).toISOString();
      const now = endOfDay(new Date()).toISOString();

      let query = supabase
        .from("rank_rent_conversions")
        .select("created_at, event_type")
        .eq("site_id", siteId)
        .gte("created_at", last7Days)
        .lte("created_at", now);

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      const { data, error } = await query;

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
          } else if (isConversionEvent(conv.event_type)) {
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
    queryKey: ["analytics-conversion-rate", siteId, startDate, endDate, conversionType],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("created_at, event_type")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      const { data, error } = await query;

      const dailyStats: Record<string, { pageViews: number; conversions: number }> = {};
      
      data?.forEach(conv => {
        const dateStr = new Date(conv.created_at).toISOString().split('T')[0];
        
        if (!dailyStats[dateStr]) {
          dailyStats[dateStr] = { pageViews: 0, conversions: 0 };
        }

        if (conv.event_type === "page_view") {
          dailyStats[dateStr].pageViews++;
        } else if (isConversionEvent(conv.event_type)) {
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
    queryKey: ["analytics-pageviews-timeline", siteId, startDate, endDate, device, conversionType],
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

      if (conversionType === "ecommerce") {
        currentQuery = currentQuery.eq("is_ecommerce_event", true);
        previousQuery = previousQuery.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        currentQuery = currentQuery.eq("is_ecommerce_event", false);
        previousQuery = previousQuery.eq("is_ecommerce_event", false);
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
    queryKey: ["analytics-top-referrers", siteId, startDate, endDate, device, conversionType],
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

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }

      // Usar paginação para buscar todos os registros (> 1000)
      const data = await fetchAllPaginated<{ referrer: string }>(query);

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
    queryKey: ["analytics-page-performance", siteId, startDate, endDate, device, conversionType],
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

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
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
        } else if (isConversionEvent(conv.event_type)) {
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
  const conversionsTimeline = conversionsForTimeline?.reduce((acc: any[], conv: any) => {
    const dateObj = new Date(conv.created_at);
    const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
    
    let existing = acc.find(item => item.date === dateStr);
    
    if (!existing) {
      existing = {
        date: dateStr,
        total: 0,
      };
      acc.push(existing);
    }
    
    // Incrementar contador apenas se for conversão válida
    const eventType = conv.event_type;
    if (isConversionEvent(eventType)) {
      existing[eventType] = (existing[eventType] || 0) + 1;
      existing.total++;
    }
    
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

  // Page View Hourly Data - agregação por dia da semana e hora
  const pageViewHourlyData = pageViewsList?.reduce((acc: Record<string, number>, pv: any) => {
    const date = new Date(pv.created_at);
    const hour = date.getHours();
    const day = date.getDay();
    const key = `${day}-${hour}`;
    
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Debug: verificar agregação de page views
  console.log('🔍 Page View Hourly Data Debug:', {
    pageViewsListLength: pageViewsList?.length || 0,
    pageViewsListSample: pageViewsList?.[0],
    pageViewHourlyDataKeys: Object.keys(pageViewHourlyData || {}),
    pageViewHourlyDataValues: pageViewHourlyData,
    pageViewHourlyDataSize: Object.keys(pageViewHourlyData || {}).length
  });

  // Process top page views pages
  const topPageViewPages = useMemo(() => {
    if (!pageViewsList || pageViewsList.length === 0) return [];
    
    const pageViewCounts: Record<string, number> = {};
    
    pageViewsList.forEach((pv: any) => {
      const page = pv.page_path || '/';
      pageViewCounts[page] = (pageViewCounts[page] || 0) + 1;
    });
    
    return Object.entries(pageViewCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [pageViewsList]);

  // Process page views device distribution
  const pageViewsDeviceDistribution = useMemo(() => {
    if (!pageViewsList || pageViewsList.length === 0) return [];
    
    const deviceCounts: Record<string, number> = {
      'Mobile': 0,
      'Desktop': 0,
      'Tablet': 0
    };
    
    pageViewsList.forEach((pv: any) => {
      const deviceRaw = (pv.metadata as any)?.device || 'desktop';
      const device = deviceRaw.charAt(0).toUpperCase() + deviceRaw.slice(1);
      if (deviceCounts[device] !== undefined) {
        deviceCounts[device]++;
      }
    });
    
    const total = Object.values(deviceCounts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return [];
    
    return Object.entries(deviceCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / total) * 100).toFixed(0)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [pageViewsList]);

  const isLoading = 
    metricsLoading || 
    timelineLoading || 
    eventsLoading || 
    topPagesLoading || 
    conversionsLoading ||
    pageViewsLoading ||
    pageViewsTimelineLoading ||
    topReferrersLoading ||
    pagePerformanceLoading ||
    timelineConversionsLoading;

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
    pageViewHourlyData,
    topPageViewPages,
    pageViewsDeviceDistribution,
    isLoading,
  };
};

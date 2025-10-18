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
        query = query.ilike("metadata->>device", device);
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
        query = query.ilike("metadata->>device", device);
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
        query = query.ilike("metadata->>device", device);
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
        query = query.ilike("metadata->>device", device);
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

  // Lista completa de conversões (últimas 100)
  const { data: conversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ["analytics-conversions", siteId, startDate, endDate, eventType, device],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false })
        .limit(100);

      if (eventType !== "all") {
        query = query.eq("event_type", eventType as any);
      }

      if (device !== "all") {
        query = query.ilike("metadata->>device", device);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
    enabled: !!siteId,
  });

  const isLoading = 
    metricsLoading || 
    timelineLoading || 
    eventsLoading || 
    topPagesLoading || 
    conversionsLoading;

  return {
    metrics,
    timeline,
    events,
    topPages,
    conversions,
    isLoading,
  };
};

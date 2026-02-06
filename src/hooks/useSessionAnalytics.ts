import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export interface SessionMetrics {
  totalSessions: number;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  avgDuration: number;
  avgPagesPerSession: number;
  engagementRate: number;
  bounceRate: number;
}

export interface TopPage {
  page_url: string;
  entries: number;
  exits: number;
}

export interface LocationData {
  city: string;
  country: string;
  count: number;
}

export interface ClickEventSummary {
  pageUrl: string;
  eventType: string;
  count: number;
  ctaText?: string;
}

export interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
  pageCount: number;
  locations: LocationData[];
  avgDuration: number;
  avgTimePerPage: number;
  clickEvents: ClickEventSummary[];
  sessionsWithClicks: number;
  timePerUrl: Record<string, number>;
  firstAccessTime: string;
}

export interface PagePerformanceData {
  page_url: string;
  totalVisits: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversions: number;
  conversionRate: number;
  entries: number;
  exits: number;
}

interface SessionAnalytics {
  metrics: SessionMetrics;
  topEntryPages: TopPage[];
  topExitPages: TopPage[];
  commonSequences: CommonSequence[];
  stepVolumes: Map<string, number>;
  pagePerformance: PagePerformanceData[];
}

// Interface para resultado da RPC v2
interface RPCResultV2 {
  metrics: {
    totalSessions: number;
    uniqueVisitors: number;
    newVisitors: number;
    returningVisitors: number;
    avgDuration: number;
    avgPagesPerSession: number;
    engagementRate: number;
    bounceRate: number;
  };
  topEntryPages: Array<{ page_url: string; entries: number; exits: number }>;
  topExitPages: Array<{ page_url: string; exits: number; entries: number }>;
}

export const useSessionAnalytics = (siteId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['session-analytics', siteId, days],
    queryFn: async (): Promise<SessionAnalytics> => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Usar RPC v2 otimizada (sem COUNT DISTINCT, com CTE único)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc("get_session_analytics_v2", {
          p_site_id: siteId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        throw rpcError;
      }

      const result = rpcData as unknown as RPCResultV2;

      // Se não há sessões, retornar vazio
      if (!result || result.metrics.totalSessions === 0) {
        return {
          metrics: {
            totalSessions: 0,
            uniqueVisitors: 0,
            newVisitors: 0,
            returningVisitors: 0,
            avgDuration: 0,
            avgPagesPerSession: 0,
            engagementRate: 0,
            bounceRate: 0
          },
          topEntryPages: [],
          topExitPages: [],
          commonSequences: [], // Carregado via useSessionSequences (lazy)
          stepVolumes: new Map(),
          pagePerformance: []
        };
      }

      return {
        metrics: result.metrics,
        topEntryPages: result.topEntryPages || [],
        topExitPages: result.topExitPages || [],
        commonSequences: [], // Carregado via useSessionSequences (lazy)
        stepVolumes: new Map(),
        pagePerformance: []
      };
    },
    enabled: !!siteId,
    staleTime: 120000, // 2 minutos de cache
    refetchInterval: 180000 // 3 minutos ao invés de 1 min
  });
};

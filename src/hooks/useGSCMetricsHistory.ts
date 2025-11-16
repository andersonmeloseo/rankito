import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, subHours, format } from "date-fns";

type TimeRange = '24h' | '7d' | '30d';

interface MetricPoint {
  timestamp: string;
  date: string;
  successful: number;
  failed: number;
  total: number;
  successRate: number;
  avgResponseTime?: number;
}

interface IntegrationMetric {
  integration_id: string;
  name: string;
  email: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  avg_response_time?: number;
}

interface TopUrl {
  url: string;
  count: number;
  successRate: number;
  lastIndexed: string;
}

export interface GSCMetricsHistory {
  timeline: MetricPoint[];
  integrations: IntegrationMetric[];
  topUrls: TopUrl[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    overallSuccessRate: number;
    avgResponseTime?: number;
  };
}

export function useGSCMetricsHistory(siteId: string | null, range: TimeRange = '24h') {
  return useQuery({
    queryKey: ['gsc-metrics-history', siteId, range],
    queryFn: async (): Promise<GSCMetricsHistory> => {
      if (!siteId) throw new Error('Site ID is required');

      // Calculate date range
      const endDate = new Date();
      let startDate: Date;
      let groupByInterval: 'hour' | 'day';

      switch (range) {
        case '24h':
          startDate = subHours(endDate, 24);
          groupByInterval = 'hour';
          break;
        case '7d':
          startDate = subDays(endDate, 7);
          groupByInterval = 'day';
          break;
        case '30d':
          startDate = subDays(endDate, 30);
          groupByInterval = 'day';
          break;
      }

      // Fetch all integrations for the site
      const { data: integrations, error: intError } = await supabase
        .from('google_search_console_integrations')
        .select('id, connection_name, google_email')
        .eq('site_id', siteId)
        .eq('is_active', true);

      if (intError) throw intError;
      if (!integrations || integrations.length === 0) {
        return {
          timeline: [],
          integrations: [],
          topUrls: [],
          summary: {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            overallSuccessRate: 0,
          },
        };
      }

      const integrationIds = integrations.map(i => i.id);

      // Fetch requests in date range
      const { data: requests, error: reqError } = await supabase
        .from('gsc_url_indexing_requests')
        .select('*')
        .in('integration_id', integrationIds)
        .gte('submitted_at', startDate.toISOString())
        .lte('submitted_at', endDate.toISOString())
        .order('submitted_at', { ascending: true });

      if (reqError) throw reqError;

      // Build timeline
      const timelineMap = new Map<string, { successful: number; failed: number; total: number }>();
      const integrationMap = new Map<string, { successful: number; failed: number; total: number }>();
      const urlMap = new Map<string, { count: number; successful: number; lastIndexed: string }>();

      (requests || []).forEach(req => {
        const date = new Date(req.submitted_at!);
        const key = groupByInterval === 'hour'
          ? format(date, 'yyyy-MM-dd HH:00')
          : format(startOfDay(date), 'yyyy-MM-dd');

        // Timeline aggregation
        if (!timelineMap.has(key)) {
          timelineMap.set(key, { successful: 0, failed: 0, total: 0 });
        }
        const timePoint = timelineMap.get(key)!;
        timePoint.total++;
        if (req.status === 'completed') timePoint.successful++;
        else if (req.status === 'failed') timePoint.failed++;

        // Integration aggregation
        if (!integrationMap.has(req.integration_id)) {
          integrationMap.set(req.integration_id, { successful: 0, failed: 0, total: 0 });
        }
        const intPoint = integrationMap.get(req.integration_id)!;
        intPoint.total++;
        if (req.status === 'completed') intPoint.successful++;
        else if (req.status === 'failed') intPoint.failed++;

        // URL aggregation
        if (!urlMap.has(req.url)) {
          urlMap.set(req.url, { count: 0, successful: 0, lastIndexed: req.submitted_at! });
        }
        const urlPoint = urlMap.get(req.url)!;
        urlPoint.count++;
        if (req.status === 'completed') urlPoint.successful++;
        if (new Date(req.submitted_at!) > new Date(urlPoint.lastIndexed)) {
          urlPoint.lastIndexed = req.submitted_at!;
        }
      });

      // Build timeline array
      const timeline: MetricPoint[] = Array.from(timelineMap.entries())
        .map(([timestamp, data]) => ({
          timestamp,
          date: timestamp,
          successful: data.successful,
          failed: data.failed,
          total: data.total,
          successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
        }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      // Build integrations array
      const integrationsMetrics: IntegrationMetric[] = Array.from(integrationMap.entries())
        .map(([id, data]) => {
          const integration = integrations.find(i => i.id === id);
          return {
            integration_id: id,
            name: integration?.connection_name || 'Unknown',
            email: integration?.google_email || '',
            total_requests: data.total,
            successful_requests: data.successful,
            failed_requests: data.failed,
            success_rate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
          };
        })
        .sort((a, b) => b.total_requests - a.total_requests);

      // Build top URLs array
      const topUrls: TopUrl[] = Array.from(urlMap.entries())
        .map(([url, data]) => ({
          url,
          count: data.count,
          successRate: data.count > 0 ? (data.successful / data.count) * 100 : 0,
          lastIndexed: data.lastIndexed,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate summary
      const totalRequests = requests?.length || 0;
      const successfulRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const failedRequests = requests?.filter(r => r.status === 'failed').length || 0;

      return {
        timeline,
        integrations: integrationsMetrics,
        topUrls,
        summary: {
          totalRequests,
          successfulRequests,
          failedRequests,
          overallSuccessRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        },
      };
    },
    enabled: !!siteId,
    refetchInterval: 30000, // 30s
  });
}

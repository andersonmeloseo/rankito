import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subHours, startOfHour } from 'date-fns';
import type { TimeRange } from "./useGSCTimeRange";

export const useGSCPerformanceCharts = (siteId: string, timeRange: TimeRange = '24h') => {
  const getHoursFromRange = (range: TimeRange): number => {
    switch (range) {
      case '1h': return 1;
      case '24h': return 24;
      case '7d': return 168;
      case '30d': return 720;
      default: return 24;
    }
  };

  const hours = getHoursFromRange(timeRange);
  const startDate = subHours(new Date(), hours);

  return useQuery({
    queryKey: ['gsc-performance-charts', siteId, timeRange],
    queryFn: async () => {
      // Buscar requisições de indexação Google
      const { data: googleRequests } = await supabase
        .from('gsc_url_indexing_requests')
        .select('created_at, status')
        .eq('integration_id', siteId)
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Buscar submissions IndexNow
      const { data: indexNowSubmissions } = await supabase
        .from('indexnow_submissions')
        .select('created_at, status, urls_count')
        .eq('site_id', siteId)
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Agrupar por hora
      const hourlyData = new Map();
      const now = new Date();

      for (let i = hours - 1; i >= 0; i--) {
        const hourDate = subHours(startOfHour(now), i);
        const hourLabel = format(hourDate, 'HH:mm');
        hourlyData.set(hourLabel, {
          hour: hourLabel,
          google: 0,
          indexnow: 0,
          googleSuccess: 0,
          indexnowSuccess: 0,
        });
      }

      // Processar requisições Google
      googleRequests?.forEach(req => {
        const hourLabel = format(new Date(req.created_at), 'HH:mm');
        if (hourlyData.has(hourLabel)) {
          const data = hourlyData.get(hourLabel);
          data.google++;
          if (req.status === 'completed') data.googleSuccess++;
        }
      });

      // Processar submissions IndexNow
      indexNowSubmissions?.forEach(sub => {
        const hourLabel = format(new Date(sub.created_at), 'HH:mm');
        if (hourlyData.has(hourLabel)) {
          const data = hourlyData.get(hourLabel);
          data.indexnow += sub.urls_count || 1;
          if (sub.status === 'success') data.indexnowSuccess += sub.urls_count || 1;
        }
      });

      // Calcular taxa de sucesso
      const indexingByHour = Array.from(hourlyData.values()).map(data => ({
        hour: data.hour,
        google: data.google,
        indexnow: data.indexnow,
        successRate: data.google > 0 
          ? ((data.googleSuccess + data.indexnowSuccess) / (data.google + data.indexnow)) * 100 
          : 100,
      }));

      // Calcular totais
      const totalGoogle = googleRequests?.length || 0;
      const totalIndexNow = indexNowSubmissions?.reduce((sum, s) => sum + (s.urls_count || 1), 0) || 0;
      const totalSuccess = (googleRequests?.filter(r => r.status === 'completed').length || 0) +
                          (indexNowSubmissions?.filter(s => s.status === 'success').reduce((sum, s) => sum + (s.urls_count || 1), 0) || 0);

      const avgSuccessRate = totalGoogle + totalIndexNow > 0 
        ? (totalSuccess / (totalGoogle + totalIndexNow)) * 100 
        : 0;

      const peak = indexingByHour.reduce((max, curr) => 
        (curr.google + curr.indexnow) > (max.google + max.indexnow) ? curr : max, 
        indexingByHour[0] || { hour: '00:00', google: 0, indexnow: 0 }
      );

      const avgPerHour = (totalGoogle + totalIndexNow) / hours;

      return {
        indexingByHour,
        totals: {
          google: totalGoogle,
          indexnow: totalIndexNow,
          total: totalGoogle + totalIndexNow,
          avgSuccessRate,
        },
        insights: {
          peak: {
            hour: peak.hour,
            count: peak.google + peak.indexnow,
          },
          avgPerHour: Math.round(avgPerHour),
        },
      };
    },
  });
};

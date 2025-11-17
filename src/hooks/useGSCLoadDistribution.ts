import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

interface IntegrationDistribution {
  integration_id: string;
  integration_name: string;
  email: string;
  urls_indexed_today: number;
  urls_failed_today: number;
  success_rate: number;
  quota_used: number;
  quota_remaining: number;
  avg_response_time: number;
}

interface LoadDistribution {
  integrations: IntegrationDistribution[];
  total_urls: number;
  balance_score: number; // 0-1, onde 1 é perfeitamente balanceado
  is_balanced: boolean;
}

export function useGSCLoadDistribution(siteId: string | null) {
  return useQuery({
    queryKey: ['gsc-load-distribution', siteId],
    queryFn: async (): Promise<LoadDistribution | null> => {
      if (!siteId) return null;

      console.log('📊 Fetching load distribution for site:', siteId);

      // Buscar integrações do site
      const { data: integrations, error: integrationsError } = await supabase
        .from('google_search_console_integrations')
        .select('id, connection_name, google_email')
        .eq('site_id', siteId)
        .eq('is_active', true);

      if (integrationsError || !integrations || integrations.length === 0) {
        console.error('❌ Error fetching integrations:', integrationsError);
        return null;
      }

      const today = startOfDay(new Date());
      const DAILY_QUOTA_LIMIT = 200;

      // Buscar estatísticas de cada integração
      const distributionData = await Promise.all(
        integrations.map(async (integration) => {
          // URLs indexadas hoje
          const { data: successData, error: successError } = await supabase
            .from('gsc_url_indexing_requests')
            .select('id, created_at')
            .eq('integration_id', integration.id)
            .eq('status', 'success')
            .gte('created_at', today.toISOString());

          // URLs falhadas hoje
          const { data: failedData, error: failedError } = await supabase
            .from('gsc_url_indexing_requests')
            .select('id')
            .eq('integration_id', integration.id)
            .eq('status', 'failed')
            .gte('created_at', today.toISOString());

          const urls_indexed = successData?.length || 0;
          const urls_failed = failedData?.length || 0;
          const total = urls_indexed + urls_failed;
          const success_rate = total > 0 ? (urls_indexed / total) * 100 : 100;

          // Buscar tempo médio de resposta dos logs
          const { data: usageLog } = await supabase
            .from('gsc_integration_usage_logs')
            .select('avg_response_time_ms')
            .eq('integration_id', integration.id)
            .eq('date', today.toISOString().split('T')[0])
            .single();

          return {
            integration_id: integration.id,
            integration_name: integration.connection_name,
            email: integration.google_email || '',
            urls_indexed_today: urls_indexed,
            urls_failed_today: urls_failed,
            success_rate,
            quota_used: urls_indexed,
            quota_remaining: DAILY_QUOTA_LIMIT - urls_indexed,
            avg_response_time: usageLog?.avg_response_time_ms || 0,
          };
        })
      );

      const total_urls = distributionData.reduce((sum, int) => sum + int.urls_indexed_today, 0);

      // Calcular score de balanceamento (usando coeficiente de variação)
      if (distributionData.length > 1 && total_urls > 0) {
        const mean = total_urls / distributionData.length;
        const variance = distributionData.reduce((sum, int) => {
          const diff = int.urls_indexed_today - mean;
          return sum + (diff * diff);
        }, 0) / distributionData.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0; // Coeficiente de variação
        
        // Converter CV para score 0-1 (CV baixo = balanceado = score alto)
        // CV < 0.3 = bem balanceado, CV > 1.0 = muito desbalanceado
        const balance_score = Math.max(0, Math.min(1, 1 - (cv / 1.5)));
        const is_balanced = cv < 0.5; // Threshold para considerar balanceado

        return {
          integrations: distributionData,
          total_urls,
          balance_score,
          is_balanced,
        };
      }

      // Se só tem 1 integração ou nenhuma URL, considera balanceado
      return {
        integrations: distributionData,
        total_urls,
        balance_score: 1,
        is_balanced: true,
      };
    },
    enabled: !!siteId,
    refetchInterval: 30000, // Atualizar a cada 30s
  });
}

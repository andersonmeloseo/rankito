import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IntegrationBreakdown {
  integration_id: string;
  name: string;
  email: string;
  used: number;
  limit: number;
  remaining: number;
}

export interface AggregatedQuota {
  total_integrations: number;
  total_limit: number;
  total_used: number;
  total_remaining: number;
  percentage: number;
  breakdown: IntegrationBreakdown[];
}

interface UseAggregatedGSCQuotaParams {
  siteId: string | null;
}

export function useAggregatedGSCQuota({ siteId }: UseAggregatedGSCQuotaParams) {
  return useQuery({
    queryKey: ['gsc-aggregated-quota', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      console.log('🔍 Fetching aggregated GSC quota for site:', siteId);

      const { data, error } = await supabase.functions.invoke('gsc-get-aggregated-quota', {
        body: { site_id: siteId },
      });

      if (error) {
        console.error('❌ Error fetching aggregated quota:', error);
        throw new Error(error.message || 'Failed to fetch aggregated quota');
      }

      console.log('✅ Aggregated quota fetched:', data.aggregated_quota);
      return data.aggregated_quota as AggregatedQuota;
    },
    enabled: !!siteId,
    refetchInterval: 10000, // Atualizar a cada 10s (mesmo que useGSCIndexing)
  });
}

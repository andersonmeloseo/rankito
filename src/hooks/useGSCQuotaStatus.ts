import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useGSCQuotaStatus = (siteId: string) => {
  const { data: quotaStatus } = useQuery({
    queryKey: ['gsc-quota-status', siteId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gsc-get-aggregated-quota', {
        body: { site_id: siteId },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh a cada 1min
  });

  const quotaExceeded = quotaStatus && quotaStatus.total_used >= quotaStatus.total_limit;
  const percentageUsed = quotaStatus 
    ? Math.round((quotaStatus.total_used / quotaStatus.total_limit) * 100)
    : 0;

  return {
    quotaStatus,
    quotaExceeded,
    percentageUsed,
  };
};

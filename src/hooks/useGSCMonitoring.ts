import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useGSCMonitoring = (siteId: string) => {
  // Estatísticas de validação
  const { data: validationStats } = useQuery({
    queryKey: ['gsc-validation-stats', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_discovered_urls')
        .select('validation_status')
        .eq('site_id', siteId);

      if (error) throw error;

      const stats = {
        total: data.length,
        valid: data.filter(u => u.validation_status === 'valid').length,
        invalid_domain: data.filter(u => u.validation_status === 'invalid_domain').length,
        unreachable: data.filter(u => u.validation_status === 'unreachable').length,
        duplicate: data.filter(u => u.validation_status === 'duplicate').length,
        pending: data.filter(u => !u.validation_status || u.validation_status === 'pending').length,
      };

      return stats;
    },
    enabled: !!siteId,
  });

  // Estatísticas de retry
  const { data: retryStats } = useQuery({
    queryKey: ['gsc-retry-stats', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_discovered_urls')
        .select('retry_count, next_retry_at')
        .eq('site_id', siteId)
        .not('retry_count', 'is', null)
        .gt('retry_count', 0);

      if (error) throw error;

      const now = new Date();
      const nextRetry = data
        .filter(u => u.next_retry_at && new Date(u.next_retry_at) > now)
        .sort((a, b) => new Date(a.next_retry_at!).getTime() - new Date(b.next_retry_at!).getTime())[0];

      return {
        totalInRetry: data.length,
        maxedOut: data.filter(u => u.retry_count >= 3).length,
        nextRetryAt: nextRetry?.next_retry_at || null,
      };
    },
    enabled: !!siteId,
  });

  // Estatísticas de Inspection API
  const { data: inspectionStats } = useQuery({
    queryKey: ['gsc-inspection-stats', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_discovered_urls')
        .select('google_inspection_status, google_last_inspected_at')
        .eq('site_id', siteId);

      if (error) throw error;

      const inspected = data.filter(u => u.google_inspection_status).length;
      const needsInspection = data.filter(u => !u.google_inspection_status).length;

      return {
        total: data.length,
        inspected,
        needsInspection,
        lastInspectedAt: data
          .filter(u => u.google_last_inspected_at)
          .sort((a, b) => new Date(b.google_last_inspected_at!).getTime() - new Date(a.google_last_inspected_at!).getTime())[0]
          ?.google_last_inspected_at || null,
      };
    },
    enabled: !!siteId,
  });

  return {
    validationStats,
    retryStats,
    inspectionStats,
  };
};

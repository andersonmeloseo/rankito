import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseGSCIndexingAlertsFilters {
  severity?: string;
  alertType?: string;
  resolved?: boolean;
}

export const useGSCIndexingAlerts = (
  siteId: string,
  filters?: UseGSCIndexingAlertsFilters
) => {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['gsc-indexing-alerts', siteId, filters],
    queryFn: async () => {
      let query = supabase
        .from('gsc_indexing_alerts')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (filters?.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.alertType && filters.alertType !== 'all') {
        query = query.eq('alert_type', filters.alertType);
      }

      if (filters?.resolved !== undefined) {
        if (filters.resolved) {
          query = query.not('resolved_at', 'is', null);
        } else {
          query = query.is('resolved_at', null);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  const { data: counts } = useQuery({
    queryKey: ['gsc-indexing-alerts-counts', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_indexing_alerts')
        .select('severity, resolved_at')
        .eq('site_id', siteId);

      if (error) throw error;

      const unresolved = data.filter(a => !a.resolved_at);
      
      return {
        total: data.length,
        unresolved: unresolved.length,
        critical: unresolved.filter(a => a.severity === 'critical').length,
        error: unresolved.filter(a => a.severity === 'error').length,
        warning: unresolved.filter(a => a.severity === 'warning').length,
        info: unresolved.filter(a => a.severity === 'info').length,
      };
    },
    enabled: !!siteId,
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('gsc_indexing_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-alerts-counts'] });
      toast.success('Alerta resolvido com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao resolver alerta: ${error.message}`);
    },
  });

  return {
    alerts,
    counts,
    isLoading,
    resolveAlert,
  };
};

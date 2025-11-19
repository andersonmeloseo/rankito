import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IndexingAlert {
  id: string;
  site_id: string;
  integration_id: string | null;
  job_id: string | null;
  alert_type: 'repeated_failure' | 'never_executed' | 'indexnow_missing' | 'low_success_rate' | 'config_issue';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  suggestion: string | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseGSCIndexingAlertsParams {
  siteId: string | null;
  includeAcknowledged?: boolean;
  severity?: 'critical' | 'warning' | 'info';
}

export function useGSCIndexingAlerts({
  siteId,
  includeAcknowledged = false,
  severity,
}: UseGSCIndexingAlertsParams) {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['gsc-indexing-alerts', siteId, includeAcknowledged, severity],
    queryFn: async () => {
      if (!siteId) return [];

      console.log('🚨 Fetching indexing alerts for site:', siteId);

      let query = supabase
        .from('gsc_indexing_alerts' as any)
        .select(`
          *,
          google_search_console_integrations(connection_name, google_email)
        `)
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (!includeAcknowledged) {
        query = query.eq('acknowledged', false);
      }

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching alerts:', error);
        throw error;
      }

      console.log('✅ Alerts fetched:', data?.length || 0);
      return (data || []) as unknown as IndexingAlert[];
    },
    enabled: !!siteId,
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('gsc_indexing_alerts' as any)
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alerta reconhecido');
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-alerts', siteId] });
    },
    onError: (error: Error) => {
      toast.error('Falha ao reconhecer alerta', {
        description: error.message,
      });
    },
  });

  // Calcular estatísticas dos alertas
  const stats = {
    total: alerts?.length || 0,
    critical: alerts?.filter(a => a.severity === 'critical' && !a.acknowledged).length || 0,
    warning: alerts?.filter(a => a.severity === 'warning' && !a.acknowledged).length || 0,
    info: alerts?.filter(a => a.severity === 'info' && !a.acknowledged).length || 0,
    unacknowledged: alerts?.filter(a => !a.acknowledged).length || 0,
  };

  return {
    alerts: alerts || [],
    isLoading,
    stats,
    acknowledgeAlert: acknowledgeAlert.mutate,
    isAcknowledging: acknowledgeAlert.isPending,
  };
}

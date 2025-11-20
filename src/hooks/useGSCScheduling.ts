import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGSCScheduling = (siteId: string) => {
  const queryClient = useQueryClient();

  // Buscar agendamentos pendentes
  const { data: scheduledSubmissions, isLoading: isLoadingScheduled } = useQuery({
    queryKey: ['gsc-scheduled-submissions', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_scheduled_submissions')
        .select(`
          *,
          integration:google_search_console_integrations(connection_name)
        `)
        .eq('site_id', siteId)
        .in('status', ['pending', 'processing'])
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Auto-refresh a cada 30s
  });

  // Buscar histórico completo
  const { data: submissionHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['gsc-submission-history', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_scheduled_submissions')
        .select(`
          *,
          integration:google_search_console_integrations(connection_name)
        `)
        .eq('site_id', siteId)
        .in('status', ['completed', 'failed'])
        .order('completed_at', { ascending: false, nullsFirst: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar estatísticas
  const { data: queueStats } = useQuery({
    queryKey: ['gsc-queue-stats', siteId],
    queryFn: async () => {
      const { count: discovered } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('current_status', 'discovered')
        .eq('auto_schedule_enabled', true)
        .is('scheduled_for', null);

      const { count: scheduled } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .not('scheduled_for', 'is', null);

      return {
        queued: discovered || 0,
        scheduled: scheduled || 0,
      };
    },
    refetchInterval: 60000,
  });

  // Agendar sitemap
  const scheduleSitemap = useMutation({
    mutationFn: async (params: {
      sitemap_url: string;
      scheduled_for: string;
      integration_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('gsc-schedule-sitemap', {
        body: {
          site_id: siteId,
          ...params,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-scheduled-submissions'] });
      toast.success('Sitemap agendado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao agendar: ${error.message}`);
    },
  });

  // Cancelar agendamentos
  const cancelScheduled = useMutation({
    mutationFn: async (submissionIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('gsc-cancel-scheduled', {
        body: { submission_ids: submissionIds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-scheduled-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-queue-stats'] });
      toast.success('Agendamento cancelado!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao cancelar: ${error.message}`);
    },
  });

  // Forçar reagendamento
  const rescheduleNow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gsc-smart-scheduler', {
        body: { site_id: siteId, force: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-scheduled-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-queue-stats'] });
      toast.success(`${data.urls_scheduled} URLs reagendadas!`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao reagendar: ${error.message}`);
    },
  });

  return {
    scheduledSubmissions,
    submissionHistory,
    queueStats,
    isLoadingScheduled,
    isLoadingHistory,
    scheduleSitemap,
    cancelScheduled,
    rescheduleNow,
  };
};

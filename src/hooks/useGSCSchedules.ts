import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errorMessages";

export interface GSCSchedule {
  id: string;
  site_id: string;
  integration_id: string | null;
  schedule_name: string;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval_hours: number | null;
  sitemap_paths: string[] | null;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleExecutionLog {
  id: string;
  schedule_id: string;
  executed_at: string;
  status: 'success' | 'partial_success' | 'error';
  sitemaps_attempted: string[];
  sitemaps_succeeded: string[];
  sitemaps_failed: string[];
  error_message: string | null;
  execution_duration_ms: number;
  integration_name: string | null;
}

interface UseGSCSchedulesParams {
  siteId: string;
}

export function useGSCSchedules({ siteId }: UseGSCSchedulesParams) {
  const queryClient = useQueryClient();

  // Buscar agendamentos do site
  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ['gsc-schedules', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_sitemap_schedules')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GSCSchedule[];
    },
    enabled: !!siteId,
  });

  // Buscar logs de execução
  const { data: executionLogs } = useQuery({
    queryKey: ['gsc-schedule-logs', siteId],
    queryFn: async () => {
      if (!schedules || schedules.length === 0) return [];

      const scheduleIds = schedules.map(s => s.id);
      const { data, error } = await supabase
        .from('gsc_schedule_execution_logs')
        .select('*')
        .in('schedule_id', scheduleIds)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ScheduleExecutionLog[];
    },
    enabled: !!schedules && schedules.length > 0,
  });

  // Criar agendamento
  const createSchedule = useMutation({
    mutationFn: async (schedule: Omit<GSCSchedule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('gsc_sitemap_schedules')
        .insert(schedule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedules', siteId] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: Error) => {
      const errorMsg = getErrorMessage(error, 'criar agendamento');
      toast.error(errorMsg.title, { description: errorMsg.description });
    },
  });

  // Atualizar agendamento
  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GSCSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('gsc_sitemap_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedules', siteId] });
      toast.success('Agendamento atualizado!');
    },
    onError: (error: Error) => {
      const errorMsg = getErrorMessage(error, 'atualizar agendamento');
      toast.error(errorMsg.title, { description: errorMsg.description });
    },
  });

  // Deletar agendamento
  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gsc_sitemap_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedules', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-schedule-logs', siteId] });
      toast.success('Agendamento excluído!');
    },
    onError: (error: Error) => {
      const errorMsg = getErrorMessage(error, 'excluir agendamento');
      toast.error(errorMsg.title, { description: errorMsg.description });
    },
  });

  // Executar agora (manualmente)
  const executeNow = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { data, error } = await supabase.functions.invoke('gsc-execute-schedule-now', {
        body: { schedule_id: scheduleId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedules', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-schedule-logs', siteId] });
      
      if (data.status === 'success') {
        toast.success(`✅ ${data.sitemaps_succeeded} sitemaps enviados com sucesso!`);
      } else if (data.status === 'partial_success') {
        toast.warning(`⚠️ ${data.sitemaps_succeeded}/${data.sitemaps_attempted} sitemaps enviados`);
      } else {
        const errorMsg = getErrorMessage(data, 'enviar sitemaps');
        toast.error(errorMsg.title, { description: errorMsg.description });
      }
    },
    onError: (error: Error) => {
      const errorMsg = getErrorMessage(error, 'executar agendamento');
      toast.error(errorMsg.title, { description: errorMsg.description });
    },
  });

  // Pausar/Reativar agendamento
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('gsc_sitemap_schedules')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedules', siteId] });
      toast.success(variables.is_active ? 'Agendamento ativado!' : 'Agendamento pausado!');
    },
    onError: (error: Error) => {
      const errorMsg = getErrorMessage(error, 'alterar status do agendamento');
      toast.error(errorMsg.title, { description: errorMsg.description });
    },
  });

  return {
    schedules: schedules || [],
    executionLogs: executionLogs || [],
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    executeNow,
    toggleActive,
    refetch,
  };
}

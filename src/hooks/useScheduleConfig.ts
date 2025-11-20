import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduleConfig {
  id?: string;
  site_id: string;
  schedule_name: string;
  enabled: boolean;
  is_active: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'custom';
  interval_hours?: number;
  specific_days?: number[];
  specific_time: string;
  max_urls_per_run: number;
  distribute_across_day: boolean;
  pause_on_quota_exceeded: boolean;
  next_run_at?: string;
  last_run_at?: string;
}

export const useScheduleConfig = (siteId: string) => {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['gsc-schedule-configs', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_schedule_config')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ScheduleConfig[];
    },
  });

  const createConfig = useMutation({
    mutationFn: async (newConfig: Partial<ScheduleConfig>) => {
      const { data, error } = await supabase.functions.invoke('gsc-update-schedule-config', {
        body: {
          site_id: siteId,
          config: newConfig,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedule-configs'] });
      toast.success('Agendamento criado!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Partial<ScheduleConfig> }) => {
      const { data, error } = await supabase.functions.invoke('gsc-update-schedule-config', {
        body: {
          site_id: siteId,
          config_id: id,
          config,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedule-configs'] });
      toast.success('Agendamento atualizado!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (configId: string) => {
      const { error } = await supabase
        .from('gsc_schedule_config')
        .delete()
        .eq('id', configId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedule-configs'] });
      toast.success('Agendamento removido!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const toggleActiveStatus = useMutation({
    mutationFn: async ({ configId, isActive }: { configId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('gsc_schedule_config')
        .update({ is_active: isActive })
        .eq('id', configId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-schedule-configs'] });
      toast.success('Status atualizado!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  return {
    configs,
    isLoading,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleActiveStatus,
  };
};
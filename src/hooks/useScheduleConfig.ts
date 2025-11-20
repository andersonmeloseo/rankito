import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduleConfig {
  id?: string;
  site_id: string;
  enabled: boolean;
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

  const { data: config, isLoading } = useQuery({
    queryKey: ['gsc-schedule-config', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_schedule_config')
        .select('*')
        .eq('site_id', siteId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ScheduleConfig | null;
    },
  });

  const updateConfig = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['gsc-schedule-config'] });
      toast.success('Configuração atualizada!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  return {
    config,
    isLoading,
    updateConfig,
  };
};
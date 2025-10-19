import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./use-toast";

export interface Activity {
  id: string;
  user_id: string;
  deal_id: string | null;
  client_id: string | null;
  task_id: string | null;
  activity_type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'note' | 'status_change' | 'deal_created' | 'deal_won' | 'deal_lost' | 'task_completed' | 'contract_signed' | 'payment_received';
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface ActivityFilters {
  dealId?: string;
  clientId?: string;
  limit?: number;
}

export const useActivities = (userId: string, filters?: ActivityFilters) => {
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', userId, filters],
    queryFn: async () => {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.dealId) {
        query = query.eq('deal_id', filters.dealId);
      }

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Activity[];
    },
  });

  const createActivity = useMutation({
    mutationFn: async (newActivity: Omit<Activity, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('crm_activities')
        .insert([newActivity]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar atividade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    activities,
    isLoading,
    createActivity: createActivity.mutate,
  };
};

export const useRecentActivities = (userId: string, limit: number = 10) => {
  return useActivities(userId, { limit });
};

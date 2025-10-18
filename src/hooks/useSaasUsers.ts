import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./use-toast";

interface UserFilters {
  search?: string;
  plan?: string;
  status?: string;
  country?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const useSaasUsers = (filters?: UserFilters) => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['saas-users', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_subscriptions(
            id,
            status,
            current_period_start,
            current_period_end,
            trial_end_date,
            canceled_at,
            subscription_plans(name, price)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,whatsapp.ilike.%${filters.search}%`);
      }

      if (filters?.country) {
        query = query.eq('country_code', filters.country);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by subscription status if needed
      let filteredData = data;
      if (filters?.status) {
        filteredData = data.filter((user: any) => {
          const sub = user.user_subscriptions?.[0];
          if (!sub) return filters.status === 'no_subscription';
          return sub.status === filters.status;
        });
      }

      // Filter by plan if needed
      if (filters?.plan) {
        filteredData = filteredData.filter((user: any) => {
          const sub = user.user_subscriptions?.[0];
          return sub?.subscription_plans?.name === filters.plan;
        });
      }

      return filteredData;
    },
  });

  const blockUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      toast({ title: "Usuário bloqueado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao bloquear usuário", description: error.message, variant: "destructive" });
    },
  });

  const unblockUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      toast({ title: "Usuário desbloqueado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao desbloquear usuário", description: error.message, variant: "destructive" });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      toast({ title: "Usuário atualizado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar usuário", description: error.message, variant: "destructive" });
    },
  });

  return {
    users,
    isLoading,
    blockUser: blockUser.mutate,
    unblockUser: unblockUser.mutate,
    updateUser: updateUser.mutate,
  };
};

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

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      toast({ title: "Usuário excluído com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir usuário", description: error.message, variant: "destructive" });
    },
  });

  const deleteUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds);

      if (error) throw error;
    },
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      toast({ title: `${userIds.length} usuários excluídos com sucesso` });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir usuários", description: error.message, variant: "destructive" });
    },
  });

  const assignPlan = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (existingSub) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            current_period_start: startDate,
            current_period_end: endDate,
          })
          .eq('id', existingSub.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_start: startDate,
            current_period_end: endDate,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      toast({ title: "Plano atribuído com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atribuir plano", description: error.message, variant: "destructive" });
    },
  });

  const bulkAssignPlan = useMutation({
    mutationFn: async ({ userIds, planId }: { userIds: string[]; planId: string }) => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const userId of userIds) {
        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingSub) {
          await supabase
            .from('user_subscriptions')
            .update({
              plan_id: planId,
              status: 'active',
              current_period_start: startDate,
              current_period_end: endDate,
            })
            .eq('id', existingSub.id);
        } else {
          await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              plan_id: planId,
              status: 'active',
              current_period_start: startDate,
              current_period_end: endDate,
            });
        }
      }
    },
    onSuccess: (_, { userIds }) => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      toast({ title: `Plano atribuído a ${userIds.length} usuários` });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atribuir planos", description: error.message, variant: "destructive" });
    },
  });

  const updateUserEmail = useMutation({
    mutationFn: async ({ userId, newEmail }: { userId: string; newEmail: string }) => {
      const { data, error } = await supabase.functions.invoke('update-user-email', {
        body: { userId, newEmail }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      toast({ title: "Email atualizado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar email", description: error.message, variant: "destructive" });
    },
  });

  return {
    users,
    isLoading,
    blockUser: blockUser.mutate,
    unblockUser: unblockUser.mutate,
    updateUser: updateUser.mutate,
    deleteUser: deleteUser.mutate,
    deleteUsers: deleteUsers.mutate,
    assignPlan: assignPlan.mutate,
    bulkAssignPlan: bulkAssignPlan.mutate,
    updateUserEmail: updateUserEmail.mutate,
  };
};

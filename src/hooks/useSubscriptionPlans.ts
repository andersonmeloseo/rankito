import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./use-toast";

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billing_period: string;
  features: string[];
  max_sites: number | null;
  max_pages_per_site: number | null;
  max_gsc_integrations: number | null;
  trial_days: number;
  is_active: boolean;
  display_order: number;
  stripe_checkout_url: string | null;
  has_advanced_tracking: boolean;
  created_at: string;
  updated_at: string;
}

export const useSubscriptionPlans = () => {
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubscriptionPlan> }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Plano atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPlan = useMutation({
    mutationFn: async (newPlan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('subscription_plans')
        .insert([newPlan]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Plano criado",
        description: "O novo plano foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      // Verificar se há assinaturas ativas usando este plano
      const { data: activeSubscriptions, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('plan_id', planId)
        .in('status', ['active', 'trial'])
        .limit(1);

      if (checkError) throw checkError;

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        throw new Error('Não é possível excluir um plano com assinaturas ativas. Desative o plano ou migre os usuários para outro plano primeiro.');
      }

      // Se não há assinaturas ativas, pode excluir
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Plano excluído",
        description: "O plano foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    plans,
    isLoading,
    updatePlan: updatePlan.mutate,
    createPlan: createPlan.mutate,
    deletePlan: deletePlan.mutate,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./use-toast";

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  trial_end_date: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  paused_at?: string | null;
  paused_reason?: string | null;
  notes?: string | null;
  subscription_plans?: {
    name: string;
    price: number;
    max_sites: number | null;
    max_pages_per_site: number | null;
    features: string[];
  };
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

export const useSubscriptions = () => {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: async () => {
      const { data: subsData, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(name, price, max_sites, max_pages_per_site, features)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = subsData?.map(s => s.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Merge data
      const merged = subsData?.map(sub => ({
        ...sub,
        profiles: profilesData?.find(p => p.id === sub.user_id) || null,
      }));

      return merged as UserSubscription[];
    },
  });

  const createSubscription = useMutation({
    mutationFn: async (subscription: {
      user_id: string;
      plan_id: string;
      status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
      current_period_start: string;
      current_period_end: string;
      trial_end_date?: string;
    }) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .insert([subscription]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast({
        title: "Assinatura criada",
        description: "A assinatura foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserSubscription> }) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast({
        title: "Assinatura atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar assinatura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    subscriptions,
    isLoading,
    createSubscription: createSubscription.mutate,
    updateSubscription: updateSubscription.mutate,
  };
};

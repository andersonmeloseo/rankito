import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./use-toast";

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string | null;
  payment_date: string | null;
  due_date: string;
  reference_month: string;
  invoice_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
  user_subscriptions?: {
    subscription_plans?: {
      name: string;
    };
  };
}

export const useSubscriptionPayments = () => {
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: async () => {
      const { data: paymentsData, error } = await supabase
        .from('subscription_payments')
        .select(`
          *,
          user_subscriptions(
            subscription_plans(name)
          )
        `)
        .order('due_date', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = paymentsData?.map(p => p.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Merge data
      const merged = paymentsData?.map(payment => ({
        ...payment,
        profiles: profilesData?.find(p => p.id === payment.user_id) || null,
      }));

      return merged as SubscriptionPayment[];
    },
  });

  const createPayment = useMutation({
    mutationFn: async (payment: {
      subscription_id: string;
      user_id: string;
      amount: number;
      due_date: string;
      reference_month: string;
    }) => {
      const { error } = await supabase
        .from('subscription_payments')
        .insert([payment]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
      toast({
        title: "Cobrança criada",
        description: "A cobrança foi registrada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cobrança",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubscriptionPayment> }) => {
      const { error } = await supabase
        .from('subscription_payments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
      toast({
        title: "Pagamento atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    payments,
    isLoading,
    createPayment: createPayment.mutate,
    updatePayment: updatePayment.mutate,
  };
};

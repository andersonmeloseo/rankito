import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Payment {
  id: string;
  user_id: string;
  site_id: string;
  client_id: string | null;
  due_date: string;
  payment_date: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  reference_month: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  site_name?: string;
  client_name?: string;
}

export interface PaymentFilters {
  status?: 'all' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  startDate?: string;
  endDate?: string;
  siteId?: string;
}

export interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalCancelled: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  dueSoonCount: number;
  dueSoonAmount: number;
}

export const usePayments = (userId: string, filters?: PaymentFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", userId, filters],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_payments")
        .select(`
          *,
          rank_rent_sites!inner(site_name),
          rank_rent_clients(name)
        `)
        .eq("user_id", userId)
        .order("due_date", { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq("status", filters.status);
      }

      if (filters?.startDate) {
        query = query.gte("due_date", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("due_date", filters.endDate);
      }

      if (filters?.siteId) {
        query = query.eq("site_id", filters.siteId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map joined data
      return (data || []).map((payment: any) => ({
        ...payment,
        site_name: payment.rank_rent_sites?.site_name,
        client_name: payment.rank_rent_clients?.name,
      })) as Payment[];
    },
    enabled: !!userId,
  });

  const summary: PaymentSummary = {
    totalPaid: payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    totalPending: payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    totalOverdue: payments?.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    totalCancelled: payments?.filter(p => p.status === 'cancelled').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    paidCount: payments?.filter(p => p.status === 'paid').length || 0,
    pendingCount: payments?.filter(p => p.status === 'pending').length || 0,
    overdueCount: payments?.filter(p => p.status === 'overdue').length || 0,
    dueSoonCount: payments?.filter(p => {
      if (p.status !== 'pending') return false;
      const daysUntil = Math.floor((new Date(p.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    }).length || 0,
    dueSoonAmount: payments?.filter(p => {
      if (p.status !== 'pending') return false;
      const daysUntil = Math.floor((new Date(p.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    }).reduce((sum, p) => sum + Number(p.amount), 0) || 0,
  };

  const createPayment = useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("rank_rent_payments")
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Pagamento criado",
        description: "Nova cobrança registrada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payment> & { id: string }) => {
      const { data, error } = await supabase
        .from("rank_rent_payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Pagamento atualizado",
        description: "Alterações salvas com sucesso.",
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

  const markAsPaid = useMutation({
    mutationFn: async ({ id, paymentDate, paymentMethod }: { id: string; paymentDate?: string; paymentMethod?: string }) => {
      const { data, error } = await supabase
        .from("rank_rent_payments")
        .update({
          status: 'paid',
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Pagamento confirmado",
        description: "Cobrança marcada como paga.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rank_rent_payments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Pagamento excluído",
        description: "Cobrança removida do sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    payments: payments || [],
    summary,
    isLoading,
    createPayment,
    updatePayment,
    markAsPaid,
    deletePayment,
  };
};

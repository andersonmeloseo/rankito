import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

export interface PaymentAlert {
  type: 'overdue' | 'due_soon';
  count: number;
  totalAmount: number;
  payments: Array<{
    id: string;
    site_name: string;
    amount: number;
    due_date: string;
    days_diff: number;
  }>;
}

export const usePaymentAlerts = (userId: string) => {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["payment-alerts", userId],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from("rank_rent_payments")
        .select(`
          id,
          due_date,
          amount,
          status,
          rank_rent_sites!inner(site_name)
        `)
        .eq("user_id", userId)
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true });

      if (error) throw error;

      const now = new Date();
      const overdue: PaymentAlert['payments'] = [];
      const dueSoon: PaymentAlert['payments'] = [];

      (payments || []).forEach((payment: any) => {
        const dueDate = new Date(payment.due_date);
        const daysDiff = differenceInDays(dueDate, now);

        const alertPayment = {
          id: payment.id,
          site_name: payment.rank_rent_sites?.site_name || 'Site sem nome',
          amount: Number(payment.amount),
          due_date: payment.due_date,
          days_diff: daysDiff,
        };

        if (daysDiff < 0) {
          overdue.push(alertPayment);
        } else if (daysDiff <= 7) {
          dueSoon.push(alertPayment);
        }
      });

      return {
        overdue: {
          type: 'overdue' as const,
          count: overdue.length,
          totalAmount: overdue.reduce((sum, p) => sum + p.amount, 0),
          payments: overdue,
        },
        dueSoon: {
          type: 'due_soon' as const,
          count: dueSoon.length,
          totalAmount: dueSoon.reduce((sum, p) => sum + p.amount, 0),
          payments: dueSoon,
        },
      };
    },
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    alerts: alerts || { overdue: { type: 'overdue' as const, count: 0, totalAmount: 0, payments: [] }, dueSoon: { type: 'due_soon' as const, count: 0, totalAmount: 0, payments: [] } },
    isLoading,
    hasAlerts: (alerts?.overdue.count || 0) > 0 || (alerts?.dueSoon.count || 0) > 0,
  };
};

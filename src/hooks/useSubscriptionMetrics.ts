import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptions } from "./useSubscriptions";
import { useSubscriptionPayments } from "./useSubscriptionPayments";

export const useSubscriptionMetrics = () => {
  const { subscriptions } = useSubscriptions();
  const { payments } = useSubscriptionPayments();

  const metrics = useQuery({
    queryKey: ['subscription-metrics', subscriptions, payments],
    enabled: !!subscriptions && !!payments,
    queryFn: async () => {
      // Calculate current MRR (Monthly Recurring Revenue)
      const currentDate = new Date();
      const activeSubscriptions = subscriptions?.filter(s => 
        s.status === 'active' && 
        new Date(s.current_period_end) > currentDate
      ) || [];

      const mrr = activeSubscriptions.reduce((sum, sub) => {
        return sum + (sub.subscription_plans?.price || 0);
      }, 0);

      // Get previous month MRR
      const lastMonthDate = new Date(currentDate);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      
      const previousMonthActive = subscriptions?.filter(s => {
        const endDate = new Date(s.current_period_end);
        return s.status === 'active' && 
          endDate > lastMonthDate && 
          endDate <= currentDate;
      }) || [];

      const previousMrr = previousMonthActive.reduce((sum, sub) => {
        return sum + (sub.subscription_plans?.price || 0);
      }, 0);

      const mrrGrowth = previousMrr > 0 
        ? ((mrr - previousMrr) / previousMrr) * 100 
        : 0;

      // Active subscribers
      const activeSubscribers = activeSubscriptions.length;

      // Pending payments
      const pendingPayments = payments?.filter(p => 
        p.status === 'pending' && 
        new Date(p.due_date) <= currentDate
      ) || [];
      const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      // Churn rate (cancellations this month / active at start of month)
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const canceledThisMonth = subscriptions?.filter(s => 
        s.canceled_at && 
        new Date(s.canceled_at) >= startOfMonth
      ) || [];
      
      const activeAtStartOfMonth = subscriptions?.filter(s => 
        new Date(s.created_at) < startOfMonth && 
        (!s.canceled_at || new Date(s.canceled_at) >= startOfMonth)
      ) || [];

      const churnRate = activeAtStartOfMonth.length > 0
        ? (canceledThisMonth.length / activeAtStartOfMonth.length) * 100
        : 0;

      // Total revenue (all paid payments)
      const totalRevenue = payments?.reduce((sum, p) => 
        p.status === 'paid' ? sum + p.amount : sum, 
        0
      ) || 0;

      return {
        mrr,
        mrrGrowth,
        activeSubscribers,
        pendingPaymentsCount: pendingPayments.length,
        pendingAmount,
        churnRate,
        totalRevenue,
      };
    },
  });

  return metrics;
};

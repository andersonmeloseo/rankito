import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, differenceInDays } from "date-fns";

export const useSaasMetrics = () => {
  return useQuery({
    queryKey: ['saas-metrics'],
    queryFn: async () => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));

      // Get all subscriptions and payments
      const [subscriptionsData, paymentsData, profilesData] = await Promise.all([
        supabase.from('user_subscriptions').select('*, subscription_plans(price)'),
        supabase.from('subscription_payments').select('*'),
        supabase.from('profiles').select('id, is_active, created_at')
      ]);

      const subscriptions = subscriptionsData.data || [];
      const payments = paymentsData.data || [];
      const profiles = profilesData.data || [];

      // Calculate MRR (Monthly Recurring Revenue)
      const activeSubscriptions = subscriptions.filter(s => 
        s.status === 'active' && new Date(s.current_period_end) > now
      );
      const currentMRR = activeSubscriptions.reduce((sum, sub: any) => 
        sum + (sub.subscription_plans?.price || 0), 0
      );

      // Previous month MRR
      const lastMonthActive = subscriptions.filter(s => {
        const endDate = new Date(s.current_period_end);
        return s.status === 'active' && endDate > lastMonthStart && endDate <= currentMonthStart;
      });
      const lastMonthMRR = lastMonthActive.reduce((sum, sub: any) => 
        sum + (sub.subscription_plans?.price || 0), 0
      );

      const mrrGrowth = lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0;

      // Active users (active profiles with active subscriptions)
      const activeUsers = profiles.filter(p => p.is_active).length;
      const totalUsers = profiles.length;

      // Trial to Paid conversion rate
      const trialsThisMonth = subscriptions.filter(s => 
        s.status === 'trial' && new Date(s.created_at) >= currentMonthStart
      );
      const convertedThisMonth = subscriptions.filter(s => 
        s.status === 'active' && 
        new Date(s.created_at) >= currentMonthStart &&
        s.trial_end_date
      );
      const conversionRate = trialsThisMonth.length > 0 
        ? (convertedThisMonth.length / trialsThisMonth.length) * 100 
        : 0;

      // Trials expiring in next 7 days
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const trialsExpiringSoon = subscriptions.filter(s => 
        s.status === 'trial' && 
        s.trial_end_date &&
        new Date(s.trial_end_date) <= sevenDaysFromNow &&
        new Date(s.trial_end_date) > now
      ).length;

      // Pending payments
      const pendingPayments = payments.filter(p => 
        p.status === 'pending' && new Date(p.due_date) <= now
      );
      const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Churn rate (cancellations this month / active at start of month)
      const canceledThisMonth = subscriptions.filter(s => 
        s.canceled_at && new Date(s.canceled_at) >= currentMonthStart
      );
      const activeAtStartOfMonth = subscriptions.filter(s => 
        new Date(s.created_at) < currentMonthStart &&
        (!s.canceled_at || new Date(s.canceled_at) >= currentMonthStart)
      );
      const churnRate = activeAtStartOfMonth.length > 0
        ? (canceledThisMonth.length / activeAtStartOfMonth.length) * 100
        : 0;

      return {
        mrr: currentMRR,
        mrrGrowth,
        activeUsers,
        totalUsers,
        conversionRate,
        trialsExpiringSoon,
        pendingPaymentsCount: pendingPayments.length,
        pendingAmount,
        churnRate,
      };
    },
  });
};

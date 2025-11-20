import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format, differenceInDays } from "date-fns";

interface CohortData {
  cohort_month: string;
  users_count: number;
  retention_rates: { [key: string]: number };
}

interface RetentionMetrics {
  weekly_retention: number;
  monthly_retention: number;
  churn_rate: number;
  avg_days_active: number;
}

export const useRetentionAnalytics = () => {
  const { data: cohortData, isLoading: cohortsLoading } = useQuery({
    queryKey: ['retention-cohorts'],
    queryFn: async () => {
      // Get users grouped by signup month
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, created_at, last_activity_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group users by cohort (signup month)
      const cohorts: { [key: string]: any[] } = {};
      
      users?.forEach(user => {
        const cohortMonth = format(new Date(user.created_at), 'yyyy-MM');
        if (!cohorts[cohortMonth]) {
          cohorts[cohortMonth] = [];
        }
        cohorts[cohortMonth].push(user);
      });

      // Calculate retention rates for each cohort
      const cohortAnalysis: CohortData[] = Object.entries(cohorts).map(([month, cohortUsers]) => {
        const cohortStart = new Date(month + '-01');
        const retention_rates: { [key: string]: number } = {};

        // Calculate retention for months 0-5
        for (let i = 0; i <= 5; i++) {
          const checkDate = subMonths(cohortStart, -i);
          const activeUsers = cohortUsers.filter(user => {
            if (!user.last_activity_at) return false;
            const lastActive = new Date(user.last_activity_at);
            return lastActive >= checkDate;
          }).length;

          retention_rates[`month_${i}`] = cohortUsers.length > 0 
            ? (activeUsers / cohortUsers.length) * 100 
            : 0;
        }

        return {
          cohort_month: month,
          users_count: cohortUsers.length,
          retention_rates,
        };
      });

      return cohortAnalysis;
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['retention-metrics'],
    queryFn: async () => {
      const now = new Date();
      const oneWeekAgo = subMonths(now, 0);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneMonthAgo = subMonths(now, 1);

      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at, last_activity_at');

      if (usersError) throw usersError;

      const totalUsers = allUsers?.length || 0;

      // Weekly retention: users active in last 7 days
      const activeLastWeek = allUsers?.filter(u => 
        u.last_activity_at && new Date(u.last_activity_at) >= oneWeekAgo
      ).length || 0;

      // Monthly retention: users active in last 30 days
      const activeLastMonth = allUsers?.filter(u => 
        u.last_activity_at && new Date(u.last_activity_at) >= oneMonthAgo
      ).length || 0;

      // Churn rate: users created > 30 days ago but not active in last 30 days
      const oldUsers = allUsers?.filter(u => 
        new Date(u.created_at) < oneMonthAgo
      ) || [];

      const churnedUsers = oldUsers.filter(u => 
        !u.last_activity_at || new Date(u.last_activity_at) < oneMonthAgo
      ).length;

      const churnRate = oldUsers.length > 0 
        ? (churnedUsers / oldUsers.length) * 100 
        : 0;

      // Average days active
      const avgDaysActive = allUsers?.reduce((sum, user) => {
        if (!user.last_activity_at) return sum;
        const days = differenceInDays(
          new Date(user.last_activity_at),
          new Date(user.created_at)
        );
        return sum + Math.max(0, days);
      }, 0) || 0;

      const metrics: RetentionMetrics = {
        weekly_retention: totalUsers > 0 ? (activeLastWeek / totalUsers) * 100 : 0,
        monthly_retention: totalUsers > 0 ? (activeLastMonth / totalUsers) * 100 : 0,
        churn_rate: churnRate,
        avg_days_active: totalUsers > 0 ? avgDaysActive / totalUsers : 0,
      };

      return metrics;
    },
  });

  const { data: planRetention, isLoading: planRetentionLoading } = useQuery({
    queryKey: ['plan-retention'],
    queryFn: async () => {
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          user_id,
          status,
          subscription_plans(name)
        `);

      if (error) throw error;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, last_activity_at')
        .in('id', subscriptions?.map(s => s.user_id) || []);

      const oneMonthAgo = subMonths(new Date(), 1);
      
      const planStats: { [key: string]: { total: number; active: number } } = {};

      subscriptions?.forEach(sub => {
        const planName = sub.subscription_plans?.name || 'Unknown';
        if (!planStats[planName]) {
          planStats[planName] = { total: 0, active: 0 };
        }
        planStats[planName].total++;

        const profile = profiles?.find(p => p.id === sub.user_id);
        if (profile?.last_activity_at && new Date(profile.last_activity_at) >= oneMonthAgo) {
          planStats[planName].active++;
        }
      });

      return Object.entries(planStats).map(([plan, stats]) => ({
        plan,
        total_users: stats.total,
        active_users: stats.active,
        retention_rate: stats.total > 0 ? (stats.active / stats.total) * 100 : 0,
      }));
    },
  });

  return {
    cohortData,
    metrics,
    planRetention,
    isLoading: cohortsLoading || metricsLoading || planRetentionLoading,
  };
};

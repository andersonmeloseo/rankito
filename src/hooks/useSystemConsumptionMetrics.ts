import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface TopUser {
  userId: string;
  userName: string;
  userEmail: string;
  totalSites: number;
  totalPages: number;
  totalConversions: number;
}

interface PlanDistribution {
  planName: string;
  userCount: number;
  sitesCount: number;
  pagesCount: number;
}

interface SystemConsumptionMetrics {
  global: {
    totalSites: number;
    totalPages: number;
    totalConversions: number;
    gscRequestsLast30Days: number;
    activeGscIntegrations: number;
    geoRequestsLast30Days: number;
  };
  evolution: Array<{
    date: string;
    conversions: number;
  }>;
  topUsers: TopUser[];
  distributionByPlan: PlanDistribution[];
}

export const useSystemConsumptionMetrics = () => {
  return useQuery({
    queryKey: ['system-consumption-metrics'],
    queryFn: async (): Promise<SystemConsumptionMetrics> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Fetch all metrics in parallel - using RPC for counts to bypass RLS timeout
      const [
        globalCounts,
        dailyConversions,
        topUsersData,
        planDistributionData
      ] = await Promise.all([
        // Global counts via RPC (bypasses RLS for super admins)
        supabase.rpc('get_system_consumption_counts'),
        
        // Daily evolution - limited query, should work fine
        supabase
          .from('rank_rent_conversions')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: true })
          .limit(10000),
        
        // Top users by consumption
        supabase.rpc('get_top_users_by_consumption', { limit_count: 10 }),
        
        // Distribution by plan
        supabase.rpc('get_plan_distribution')
      ]);

      // Parse global counts from RPC - cast to proper type
      interface GlobalCountsResult {
        totalSites: number;
        totalPages: number;
        totalConversions: number;
        gscRequestsLast30Days: number;
        activeGscIntegrations: number;
        geoRequestsLast30Days: number;
      }
      
      const defaultCounts: GlobalCountsResult = {
        totalSites: 0,
        totalPages: 0,
        totalConversions: 0,
        gscRequestsLast30Days: 0,
        activeGscIntegrations: 0,
        geoRequestsLast30Days: 0
      };
      
      const counts: GlobalCountsResult = globalCounts.data 
        ? (globalCounts.data as unknown as GlobalCountsResult)
        : defaultCounts;

      // Process daily evolution
      const evolutionByDay: Record<string, number> = {};
      dailyConversions.data?.forEach((conv) => {
        const day = format(new Date(conv.created_at), 'yyyy-MM-dd');
        evolutionByDay[day] = (evolutionByDay[day] || 0) + 1;
      });

      const evolution = Object.entries(evolutionByDay).map(([date, conversions]) => ({
        date,
        conversions,
      }));

      // Process top users
      const topUsers: TopUser[] = (topUsersData.data || []).map((user: any) => ({
        userId: user.user_id,
        userName: user.user_name,
        userEmail: user.user_email,
        totalSites: Number(user.total_sites),
        totalPages: Number(user.total_pages),
        totalConversions: Number(user.total_conversions),
      }));

      // Process plan distribution from RPC result
      const distributionByPlan: PlanDistribution[] = (planDistributionData.data || []).map((plan: any) => ({
        planName: plan.plan_name,
        userCount: Number(plan.user_count),
        sitesCount: Number(plan.sites_count),
        pagesCount: Number(plan.pages_count),
      }));

      return {
        global: {
          totalSites: counts.totalSites || 0,
          totalPages: counts.totalPages || 0,
          totalConversions: counts.totalConversions || 0,
          gscRequestsLast30Days: counts.gscRequestsLast30Days || 0,
          activeGscIntegrations: counts.activeGscIntegrations || 0,
          geoRequestsLast30Days: counts.geoRequestsLast30Days || 0,
        },
        evolution,
        topUsers,
        distributionByPlan,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Cache valid for 2 minutes
  });
};

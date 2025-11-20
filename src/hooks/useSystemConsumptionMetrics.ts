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

      // Fetch all metrics in parallel
      const [
        sitesData,
        pagesData,
        conversionsData,
        gscRequests,
        gscIntegrations,
        geoRequests,
        dailyConversions,
        topUsersData,
        planDistributionData
      ] = await Promise.all([
        // Total sites
        supabase
          .from('rank_rent_sites')
          .select('id', { count: 'exact', head: true }),
        
        // Total pages
        supabase
          .from('rank_rent_pages')
          .select('id', { count: 'exact', head: true }),
        
        // Total conversions
        supabase
          .from('rank_rent_conversions')
          .select('id', { count: 'exact', head: true }),
        
        // GSC requests (last 30 days)
        supabase
          .from('gsc_url_indexing_requests')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo),
        
        // Active GSC integrations
        supabase
          .from('google_search_console_integrations')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Geo requests (conversions with city)
        supabase
          .from('rank_rent_conversions')
          .select('id', { count: 'exact', head: true })
          .not('city', 'is', null)
          .gte('created_at', thirtyDaysAgo),
        
        // Daily evolution
        supabase
          .from('rank_rent_conversions')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: true }),
        
        // Top users by consumption
        supabase.rpc('get_top_users_by_consumption', { limit_count: 10 }),
        
        // Distribution by plan
        supabase
          .from('user_subscriptions')
          .select(`
            plan_id,
            user_id,
            subscription_plans!inner(name)
          `)
          .eq('status', 'active')
      ]);

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

      // Process plan distribution
      const planMap = new Map<string, { userCount: number; sitesCount: number; pagesCount: number }>();
      
      if (planDistributionData.data) {
        for (const sub of planDistributionData.data) {
          const planName = (sub.subscription_plans as any)?.name || 'Sem Plano';
          
          if (!planMap.has(planName)) {
            planMap.set(planName, { userCount: 0, sitesCount: 0, pagesCount: 0 });
          }
          
          const plan = planMap.get(planName)!;
          plan.userCount++;
          
          // Get sites and pages for this user
          const { data: userSites } = await supabase
            .from('rank_rent_sites')
            .select('id')
            .eq('owner_user_id', sub.user_id);
          
          if (userSites) {
            plan.sitesCount += userSites.length;
            
            for (const site of userSites) {
              const { count } = await supabase
                .from('rank_rent_pages')
                .select('id', { count: 'exact', head: true })
                .eq('site_id', site.id);
              
              plan.pagesCount += count || 0;
            }
          }
        }
      }

      const distributionByPlan: PlanDistribution[] = Array.from(planMap.entries()).map(
        ([planName, stats]) => ({
          planName,
          ...stats,
        })
      );

      return {
        global: {
          totalSites: sitesData.count || 0,
          totalPages: pagesData.count || 0,
          totalConversions: conversionsData.count || 0,
          gscRequestsLast30Days: gscRequests.count || 0,
          activeGscIntegrations: gscIntegrations.count || 0,
          geoRequestsLast30Days: geoRequests.count || 0,
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

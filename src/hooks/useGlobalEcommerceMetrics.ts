import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

interface GlobalEcommerceMetrics {
  totalRevenue: number;
  totalOrders: number;
  globalAOV: number;
  activeSites: number;
  topProjects: Array<{
    siteId: string;
    siteName: string;
    revenue: number;
    orders: number;
    aov: number;
    views: number;
  }>;
  revenueEvolution: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export const useGlobalEcommerceMetrics = (userId: string | undefined, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['global-ecommerce-metrics', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      // Fetch all user sites
      const { data: sites, error: sitesError } = await supabase
        .from('rank_rent_sites')
        .select('id, site_name')
        .eq('owner_user_id', userId);

      if (sitesError) throw sitesError;
      if (!sites || sites.length === 0) {
        return {
          totalRevenue: 0,
          totalOrders: 0,
          globalAOV: 0,
          activeSites: 0,
          topProjects: [],
          revenueEvolution: []
        } as GlobalEcommerceMetrics;
      }

      const siteIds = sites.map(s => s.id);

      // Fetch all e-commerce conversions for user's sites
      const { data: conversions, error: conversionsError } = await supabase
        .from('rank_rent_conversions')
        .select('site_id, event_type, metadata, created_at')
        .in('site_id', siteIds)
        .eq('is_ecommerce_event', true)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (conversionsError) throw conversionsError;

      // Calculate global metrics
      const purchases = conversions?.filter(c => c.event_type === 'purchase') || [];
      const totalRevenue = purchases.reduce((sum, p) => {
        const metadata = p.metadata as any;
        const revenue = parseFloat(metadata?.revenue || '0');
        return sum + revenue;
      }, 0);

      const totalOrders = purchases.length;
      const globalAOV = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate per-site metrics for ranking
      const siteMetrics = new Map<string, { revenue: number; orders: number }>();
      
      purchases.forEach(p => {
        if (!siteMetrics.has(p.site_id)) {
          siteMetrics.set(p.site_id, { revenue: 0, orders: 0 });
        }
        const metrics = siteMetrics.get(p.site_id)!;
        const metadata = p.metadata as any;
        metrics.revenue += parseFloat(metadata?.revenue || '0');
        metrics.orders += 1;
      });

      const activeSites = siteMetrics.size;

      // Create top projects ranking
      const topProjects = Array.from(siteMetrics.entries())
        .map(([siteId, metrics]) => {
          const site = sites.find(s => s.id === siteId);
          // Count views for this site
          const siteViews = conversions.filter(
            c => c.site_id === siteId && c.event_type === 'product_view'
          ).length;
          
          return {
            siteId,
            siteName: site?.site_name || 'Site Desconhecido',
            revenue: metrics.revenue,
            orders: metrics.orders,
            aov: metrics.orders > 0 ? metrics.revenue / metrics.orders : 0,
            views: siteViews
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate daily revenue evolution (last 30 days)
      const dailyMetrics = new Map<string, { revenue: number; orders: number }>();
      
      purchases.forEach(p => {
        const date = format(new Date(p.created_at), 'yyyy-MM-dd');
        if (!dailyMetrics.has(date)) {
          dailyMetrics.set(date, { revenue: 0, orders: 0 });
        }
        const metrics = dailyMetrics.get(date)!;
        const metadata = p.metadata as any;
        metrics.revenue += parseFloat(metadata?.revenue || '0');
        metrics.orders += 1;
      });

      // Fill missing days with zero values
      const revenueEvolution: Array<{ date: string; revenue: number; orders: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd');
        const metrics = dailyMetrics.get(date) || { revenue: 0, orders: 0 };
        revenueEvolution.push({
          date,
          revenue: metrics.revenue,
          orders: metrics.orders
        });
      }

      return {
        totalRevenue,
        totalOrders,
        globalAOV,
        activeSites,
        topProjects,
        revenueEvolution
      } as GlobalEcommerceMetrics;
    },
    enabled: !!userId && (options?.enabled !== false),
    staleTime: 120000, // 2 minutos de cache
    refetchInterval: 300000 // 5 minutos ao invés de 30s
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

interface ComparisonMetrics {
  current: {
    revenue: number;
    orders: number;
    aov: number;
    productViews: number;
    addToCarts: number;
    checkouts: number;
  };
  previous: {
    revenue: number;
    orders: number;
    aov: number;
    productViews: number;
    addToCarts: number;
    checkouts: number;
  };
  growth: {
    revenue: number;
    orders: number;
    aov: number;
    conversionRate: number;
  };
}

export const useEcommerceComparison = (userId: string | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ["ecommerce-comparison", userId, days],
    queryFn: async (): Promise<ComparisonMetrics> => {
      if (!userId) throw new Error("User ID required");

      // Calculate date ranges
      const currentEnd = new Date();
      const currentStart = startOfDay(subDays(currentEnd, days));
      const previousStart = startOfDay(subDays(currentStart, days));
      const previousEnd = endOfDay(subDays(currentStart, 1));

      // Get user sites
      const { data: sites } = await supabase
        .from("rank_rent_sites")
        .select("id")
        .eq("owner_user_id", userId);

      if (!sites || sites.length === 0) {
        return {
          current: { revenue: 0, orders: 0, aov: 0, productViews: 0, addToCarts: 0, checkouts: 0 },
          previous: { revenue: 0, orders: 0, aov: 0, productViews: 0, addToCarts: 0, checkouts: 0 },
          growth: { revenue: 0, orders: 0, aov: 0, conversionRate: 0 }
        };
      }

      const siteIds = sites.map(s => s.id);

      // Fetch current period data
      const { data: currentData } = await supabase
        .from("rank_rent_conversions")
        .select("event_type, metadata")
        .in("site_id", siteIds)
        .eq("is_ecommerce_event", true)
        .gte("created_at", currentStart.toISOString())
        .lte("created_at", currentEnd.toISOString());

      // Fetch previous period data
      const { data: previousData } = await supabase
        .from("rank_rent_conversions")
        .select("event_type, metadata")
        .in("site_id", siteIds)
        .eq("is_ecommerce_event", true)
        .gte("created_at", previousStart.toISOString())
        .lte("created_at", previousEnd.toISOString());

      // Calculate current metrics
      const current = {
        revenue: currentData?.filter(c => c.event_type === "purchase").reduce((sum, c) => {
          const metadata = c.metadata as { revenue?: number } | null;
          return sum + (Number(metadata?.revenue) || 0);
        }, 0) || 0,
        orders: currentData?.filter(c => c.event_type === "purchase").length || 0,
        aov: 0,
        productViews: currentData?.filter(c => c.event_type === "product_view").length || 0,
        addToCarts: currentData?.filter(c => c.event_type === "add_to_cart").length || 0,
        checkouts: currentData?.filter(c => c.event_type === "begin_checkout").length || 0,
      };
      current.aov = current.orders > 0 ? current.revenue / current.orders : 0;

      // Calculate previous metrics
      const previous = {
        revenue: previousData?.filter(c => c.event_type === "purchase").reduce((sum, c) => {
          const metadata = c.metadata as { revenue?: number } | null;
          return sum + (Number(metadata?.revenue) || 0);
        }, 0) || 0,
        orders: previousData?.filter(c => c.event_type === "purchase").length || 0,
        aov: 0,
        productViews: previousData?.filter(c => c.event_type === "product_view").length || 0,
        addToCarts: previousData?.filter(c => c.event_type === "add_to_cart").length || 0,
        checkouts: previousData?.filter(c => c.event_type === "begin_checkout").length || 0,
      };
      previous.aov = previous.orders > 0 ? previous.revenue / previous.orders : 0;

      // Calculate growth percentages
      const growth = {
        revenue: previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
        orders: previous.orders > 0 ? ((current.orders - previous.orders) / previous.orders) * 100 : 0,
        aov: previous.aov > 0 ? ((current.aov - previous.aov) / previous.aov) * 100 : 0,
        conversionRate: previous.productViews > 0 && current.productViews > 0 
          ? ((current.orders / current.productViews) - (previous.orders / previous.productViews)) * 100
          : 0,
      };

      return { current, previous, growth };
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};

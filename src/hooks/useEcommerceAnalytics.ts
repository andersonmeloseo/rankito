import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

interface EcommerceMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  productViews: number;
  addToCartEvents: number;
  checkoutStarts: number;
  conversionRate: number;
}

interface ProductPerformance {
  productName: string;
  views: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

interface FunnelMetrics {
  productViews: number;
  addToCarts: number;
  checkouts: number;
  purchases: number;
  viewToCartRate: number;
  cartToCheckoutRate: number;
  checkoutToSaleRate: number;
  overallConversionRate: number;
}

export const useEcommerceAnalytics = (
  siteId: string,
  startDate: Date,
  endDate: Date
) => {
  // Fetch e-commerce metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['ecommerce-metrics', siteId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_conversions')
        .select('event_type, metadata')
        .eq('site_id', siteId)
        .eq('is_ecommerce_event', true)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (error) throw error;

      // Calculate metrics
      const purchases = data.filter(e => e.event_type === 'purchase');
      const totalRevenue = purchases.reduce((sum, p) => {
        const metadata = p.metadata as any;
        const revenue = parseFloat(metadata?.revenue || '0');
        return sum + revenue;
      }, 0);

      const totalOrders = purchases.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const productViews = data.filter(e => e.event_type === 'product_view').length;
      const addToCartEvents = data.filter(e => e.event_type === 'add_to_cart').length;
      const checkoutStarts = data.filter(e => e.event_type === 'begin_checkout').length;

      const conversionRate = productViews > 0 ? (totalOrders / productViews) * 100 : 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        productViews,
        addToCartEvents,
        checkoutStarts,
        conversionRate
      } as EcommerceMetrics;
    },
    enabled: !!siteId
  });

  // Fetch product performance
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['product-performance', siteId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_conversions')
        .select('event_type, metadata')
        .eq('site_id', siteId)
        .eq('is_ecommerce_event', true)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (error) throw error;

      // Group by product
      const productMap = new Map<string, {
        views: number;
        addToCarts: number;
        purchases: number;
        revenue: number;
      }>();

      data.forEach(event => {
        const metadata = event.metadata as any;
        const productName = metadata?.product_name || 'Produto Desconhecido';
        
        if (!productMap.has(productName)) {
          productMap.set(productName, {
            views: 0,
            addToCarts: 0,
            purchases: 0,
            revenue: 0
          });
        }

        const product = productMap.get(productName)!;

        if (event.event_type === 'product_view') product.views++;
        if (event.event_type === 'add_to_cart') product.addToCarts++;
        if (event.event_type === 'purchase') {
          product.purchases++;
          product.revenue += parseFloat(metadata?.revenue || '0');
        }
      });

      // Convert to array and calculate conversion rates
      return Array.from(productMap.entries())
        .map(([productName, stats]) => ({
          productName,
          views: stats.views,
          addToCarts: stats.addToCarts,
          purchases: stats.purchases,
          revenue: stats.revenue,
          conversionRate: stats.views > 0 ? (stats.purchases / stats.views) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue) as ProductPerformance[];
    },
    enabled: !!siteId
  });

  // Fetch funnel metrics
  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['ecommerce-funnel', siteId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_conversions')
        .select('event_type')
        .eq('site_id', siteId)
        .eq('is_ecommerce_event', true)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (error) throw error;

      const productViews = data.filter(e => e.event_type === 'product_view').length;
      const addToCarts = data.filter(e => e.event_type === 'add_to_cart').length;
      const checkouts = data.filter(e => e.event_type === 'begin_checkout').length;
      const purchases = data.filter(e => e.event_type === 'purchase').length;

      const viewToCartRate = productViews > 0 ? (addToCarts / productViews) * 100 : 0;
      const cartToCheckoutRate = addToCarts > 0 ? (checkouts / addToCarts) * 100 : 0;
      const checkoutToSaleRate = checkouts > 0 ? (purchases / checkouts) * 100 : 0;
      const overallConversionRate = productViews > 0 ? (purchases / productViews) * 100 : 0;

      return {
        productViews,
        addToCarts,
        checkouts,
        purchases,
        viewToCartRate,
        cartToCheckoutRate,
        checkoutToSaleRate,
        overallConversionRate
      } as FunnelMetrics;
    },
    enabled: !!siteId
  });

  return {
    metrics,
    products,
    funnel,
    isLoading: metricsLoading || productsLoading || funnelLoading
  };
};
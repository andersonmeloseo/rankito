import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export type PerformanceType = "top" | "featured" | "warning" | "growth" | "recovery";

export interface EcommerceMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  productViews: number;
  addToCartEvents: number;
  checkoutStarts: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  averageProductValue: number;
  interestRate: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  name?: string; // alias for productName
  views: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  productUrl?: string;
  performanceType?: PerformanceType;
  badges?: PerformanceType[];
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

export interface PageAnalysis {
  pagePath: string;
  pageUrl: string;
  revenue: number;
  purchases: number;
  views: number;
  conversionRate: number;
  topProducts: Array<{
    productName: string;
    purchases: number;
    revenue: number;
  }>;
}

// Helper function to process all e-commerce data at once
const processEcommerceData = (data: any[], days: number) => {
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

  // Group by product
  const productMap = new Map<string, {
    views: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
    url: string;
  }>();

  data.forEach(event => {
    const metadata = event.metadata as any;
    const productName = metadata?.product_name || 'Produto Desconhecido';
    const pageUrl = event.page_url || '';
    
    if (!productMap.has(productName)) {
      productMap.set(productName, {
        views: 0,
        addToCarts: 0,
        purchases: 0,
        revenue: 0,
        url: ''
      });
    }

    const product = productMap.get(productName)!;

    // Priorizar URL de eventos de purchase, depois add_to_cart, depois product_view
    if (event.event_type === 'purchase' && pageUrl) {
      product.url = pageUrl;
    } else if (event.event_type === 'add_to_cart' && pageUrl && !product.url) {
      product.url = pageUrl;
    } else if (event.event_type === 'product_view' && pageUrl && !product.url) {
      product.url = pageUrl;
    }

    if (event.event_type === 'product_view') product.views++;
    if (event.event_type === 'add_to_cart') product.addToCarts++;
    if (event.event_type === 'purchase') {
      product.purchases++;
      product.revenue += parseFloat(metadata?.revenue || '0');
    }
  });

  // Convert to array and calculate conversion rates
  const products = Array.from(productMap.entries())
    .map(([productName, stats]) => ({
      productId: productName.toLowerCase().replace(/\s+/g, '-'),
      productName,
      views: stats.views,
      addToCarts: stats.addToCarts,
      purchases: stats.purchases,
      revenue: stats.revenue,
      conversionRate: stats.views > 0 ? (stats.purchases / stats.views) * 100 : 0,
      productUrl: stats.url || undefined
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Adicionar badges de performance aos produtos
  const avgConversionRate = products.length > 0 
    ? products.reduce((sum, p) => sum + p.conversionRate, 0) / products.length 
    : 0;

  const productsWithBadges = products.map((product, index) => {
    let performanceType: PerformanceType | undefined;

    if (index === 0 && product.revenue > 0) {
      performanceType = "top";
    } else if (index < 3 && product.revenue > 0) {
      performanceType = "featured";
    } else if (product.views > 100 && product.conversionRate < avgConversionRate * 0.5) {
      performanceType = "warning";
    }

    return { ...product, performanceType };
  });

  // Métricas avançadas (após productMap ser criado)
  const cartAbandonmentRate = addToCartEvents > 0 
    ? ((addToCartEvents - checkoutStarts) / addToCartEvents) * 100 
    : 0;
  const uniqueProducts = productMap.size;
  const averageProductValue = uniqueProducts > 0 ? totalRevenue / uniqueProducts : 0;
  const interestRate = productViews > 0 ? (addToCartEvents / productViews) * 100 : 0;

  // Calculate funnel metrics
  const addToCarts = data.filter(e => e.event_type === 'add_to_cart').length;
  const checkouts = data.filter(e => e.event_type === 'begin_checkout').length;

  const viewToCartRate = productViews > 0 ? (addToCarts / productViews) * 100 : 0;
  const cartToCheckoutRate = addToCarts > 0 ? (checkouts / addToCarts) * 100 : 0;
  const checkoutToSaleRate = checkouts > 0 ? (purchases.length / checkouts) * 100 : 0;
  const overallConversionRate = productViews > 0 ? (purchases.length / productViews) * 100 : 0;

  // Calculate revenue evolution by date
  const dateMap = new Map<string, { revenue: number; orders: number }>();
  
  // Initialize all dates in the range with zero values
  const endDate = new Date();
  for (let i = 0; i < days; i++) {
    const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
    dateMap.set(date, { revenue: 0, orders: 0 });
  }

  // Group purchases by date
  data.forEach(event => {
    if (event.event_type === 'purchase') {
      const date = format(new Date(event.created_at), 'yyyy-MM-dd');
      const metadata = event.metadata as any;
      const revenue = parseFloat(metadata?.revenue || '0');
      
      if (dateMap.has(date)) {
        const current = dateMap.get(date)!;
        current.revenue += revenue;
        current.orders += 1;
      }
    }
  });

  // Convert to array for chart
  const revenueEvolution = Array.from(dateMap.entries())
    .map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      orders: stats.orders
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Process pages analysis
  const pageMap = new Map<string, {
    pageUrl: string;
    purchases: number;
    revenue: number;
    views: number;
    productSales: Map<string, { purchases: number; revenue: number }>;
  }>();

  data.forEach(event => {
    const pagePath = event.page_path || '/';
    const pageUrl = event.page_url || '';
    
    if (!pageMap.has(pagePath)) {
      pageMap.set(pagePath, {
        pageUrl,
        purchases: 0,
        revenue: 0,
        views: 0,
        productSales: new Map(),
      });
    }

    const page = pageMap.get(pagePath)!;
    const metadata = event.metadata as any;

    if (event.event_type === 'purchase') {
      page.purchases += 1;
      page.revenue += parseFloat(metadata?.revenue || '0');

      const productName = metadata?.product_name || 'Produto Desconhecido';
      if (!page.productSales.has(productName)) {
        page.productSales.set(productName, { purchases: 0, revenue: 0 });
      }
      const productSale = page.productSales.get(productName)!;
      productSale.purchases += 1;
      productSale.revenue += parseFloat(metadata?.revenue || '0');
    } else if (event.event_type === 'product_view') {
      page.views += 1;
    }
  });

  const pages: PageAnalysis[] = Array.from(pageMap.entries())
    .map(([pagePath, stats]) => {
      const conversionRate = stats.views > 0 ? (stats.purchases / stats.views) * 100 : 0;
      
      const topProducts = Array.from(stats.productSales.entries())
        .map(([productName, sales]) => ({
          productName,
          purchases: sales.purchases,
          revenue: sales.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        pagePath,
        pageUrl: stats.pageUrl,
        revenue: stats.revenue,
        purchases: stats.purchases,
        views: stats.views,
        conversionRate,
        topProducts,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return {
    metrics: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      productViews,
      addToCartEvents,
      checkoutStarts,
      conversionRate,
      cartAbandonmentRate,
      averageProductValue,
      interestRate
    },
    products: productsWithBadges,
    pages,
    funnel: {
      productViews,
      addToCarts,
      checkouts,
      purchases: purchases.length,
      viewToCartRate,
      cartToCheckoutRate,
      checkoutToSaleRate,
      overallConversionRate
    },
    revenueEvolution
  };
};

export const useEcommerceAnalytics = (
  siteId: string,
  days: number = 30
) => {
  // ✅ Memoize dates to prevent recreating on every render
  const { startDate, endDate, previousStartDate, previousEndDate } = useMemo(() => {
    const end = new Date();
    const start = subDays(end, days);
    const previousEnd = subDays(start, 1);
    const previousStart = subDays(previousEnd, days);
    return { 
      startDate: start, 
      endDate: end,
      previousStartDate: previousStart,
      previousEndDate: previousEnd
    };
  }, [days]);

  console.log('🔄 useEcommerceAnalytics chamado:', { siteId, days, startDate, endDate });

  // ✅ Query para período atual e anterior
  const { data, isLoading, error } = useQuery({
    queryKey: ['ecommerce-all-data', siteId, days],
    queryFn: async () => {
      console.log('📡 Executando query de e-commerce...');
      
      // Query período atual
      const { data: currentData, error: currentError } = await supabase
        .from('rank_rent_conversions')
        .select('event_type, metadata, created_at')
        .eq('site_id', siteId)
        .in('event_type', ['product_view', 'add_to_cart', 'begin_checkout', 'purchase'])
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (currentError) {
        console.error('❌ Erro na query atual:', currentError);
        throw currentError;
      }

      // Query período anterior
      const { data: previousData, error: previousError } = await supabase
        .from('rank_rent_conversions')
        .select('event_type, metadata, created_at')
        .eq('site_id', siteId)
        .in('event_type', ['product_view', 'add_to_cart', 'begin_checkout', 'purchase'])
        .gte('created_at', startOfDay(previousStartDate).toISOString())
        .lte('created_at', endOfDay(previousEndDate).toISOString());

      if (previousError) {
        console.error('❌ Erro na query anterior:', previousError);
        throw previousError;
      }

      console.log('✅ Query retornou:', { 
        current: currentData?.length || 0,
        previous: previousData?.length || 0
      });

      const current = processEcommerceData(currentData || [], days);
      const previous = processEcommerceData(previousData || [], days);
      
      console.log('✅ Dados processados:', { current, previous });
      
      return { current, previous };
    },
    enabled: !!siteId,
    staleTime: 30000,
    retry: 2,
  });

  console.log('📊 Hook retornando:', { isLoading, hasData: !!data, error });

  const emptyMetrics = {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    productViews: 0,
    addToCartEvents: 0,
    checkoutStarts: 0,
    conversionRate: 0,
    cartAbandonmentRate: 0,
    averageProductValue: 0,
    interestRate: 0
  };

  const emptyFunnel = {
    productViews: 0,
    addToCarts: 0,
    checkouts: 0,
    purchases: 0,
    viewToCartRate: 0,
    cartToCheckoutRate: 0,
    checkoutToSaleRate: 0,
    overallConversionRate: 0
  };

  return {
    metrics: data?.current?.metrics || emptyMetrics,
    previousMetrics: data?.previous?.metrics || emptyMetrics,
    products: data?.current?.products || [],
    pages: data?.current?.pages || [],
    funnel: data?.current?.funnel || emptyFunnel,
    revenueEvolution: data?.current?.revenueEvolution || [],
    isLoading
  };
};
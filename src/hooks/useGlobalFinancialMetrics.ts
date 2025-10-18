import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface GlobalFinancialSummary {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  avgROI: number;
  totalSitesWithMetrics: number;
  profitableSites: number;
  unprofitableSites: number;
  totalConversions: number;
  avgProfitMargin: number;
}

export interface SiteFinancialSummary {
  site_id: string;
  site_name: string;
  site_url: string;
  client_name: string | null;
  client_id: string | null;
  is_rented: boolean;
  monthly_revenue: number;
  monthly_costs: number;
  monthly_profit: number;
  roi_percentage: number;
  profit_margin: number;
  total_pages: number;
  total_conversions: number;
}

export const useGlobalFinancialMetrics = (userId: string) => {
  const { data: sitesMetrics, isLoading } = useQuery({
    queryKey: ["global-financial-metrics", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_financial_metrics")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      // Agregar métricas por site_id
      const siteMap = new Map<string, SiteFinancialSummary>();
      
      data?.forEach(metric => {
        if (!metric.site_id) return;
        
        if (!siteMap.has(metric.site_id)) {
          siteMap.set(metric.site_id, {
            site_id: metric.site_id,
            site_name: "", // Will be set from first metric
            site_url: metric.page_url || "",
            client_name: metric.client_name,
            client_id: metric.client_id,
            is_rented: metric.is_rented || false,
            monthly_revenue: 0,
            monthly_costs: 0,
            monthly_profit: 0,
            roi_percentage: 0,
            profit_margin: 0,
            total_pages: 0,
            total_conversions: 0,
          });
        }
        
        const site = siteMap.get(metric.site_id)!;
        site.monthly_revenue += Number(metric.monthly_revenue || 0);
        site.monthly_costs += Number(metric.proportional_fixed_cost || 0) + Number(metric.monthly_conversion_costs || 0);
        site.monthly_profit += Number(metric.monthly_profit || 0);
        site.total_pages += 1;
        site.total_conversions += Number(metric.total_conversions || 0);
        
        // Set site name from first metric (all pages from same site have same name)
        if (!site.site_name && metric.page_url) {
          try {
            const url = new URL(metric.page_url);
            site.site_name = url.hostname;
          } catch {
            site.site_name = metric.page_url;
          }
        }
      });

      // Calcular ROI e margem para cada site
      const sitesArray = Array.from(siteMap.values()).map(site => {
        site.roi_percentage = site.monthly_costs > 0 
          ? ((site.monthly_profit / site.monthly_costs) * 100) 
          : 0;
        site.profit_margin = site.monthly_revenue > 0 
          ? ((site.monthly_profit / site.monthly_revenue) * 100) 
          : 0;
        return site;
      });

      return sitesArray;
    },
    enabled: !!userId,
  });

  const summary: GlobalFinancialSummary = useMemo(() => {
    if (!sitesMetrics || sitesMetrics.length === 0) {
      return {
        totalRevenue: 0,
        totalCosts: 0,
        totalProfit: 0,
        avgROI: 0,
        totalSitesWithMetrics: 0,
        profitableSites: 0,
        unprofitableSites: 0,
        totalConversions: 0,
        avgProfitMargin: 0,
      };
    }

    const totalSites = sitesMetrics.length;
    const profitable = sitesMetrics.filter(s => s.monthly_profit > 0).length;

    return {
      totalRevenue: sitesMetrics.reduce((sum, s) => sum + s.monthly_revenue, 0),
      totalCosts: sitesMetrics.reduce((sum, s) => sum + s.monthly_costs, 0),
      totalProfit: sitesMetrics.reduce((sum, s) => sum + s.monthly_profit, 0),
      avgROI: totalSites > 0 ? sitesMetrics.reduce((sum, s) => sum + s.roi_percentage, 0) / totalSites : 0,
      totalSitesWithMetrics: totalSites,
      profitableSites: profitable,
      unprofitableSites: totalSites - profitable,
      totalConversions: sitesMetrics.reduce((sum, s) => sum + s.total_conversions, 0),
      avgProfitMargin: totalSites > 0 ? sitesMetrics.reduce((sum, s) => sum + s.profit_margin, 0) / totalSites : 0,
    };
  }, [sitesMetrics]);

  return {
    sitesMetrics: sitesMetrics || [],
    summary,
    isLoading,
  };
};

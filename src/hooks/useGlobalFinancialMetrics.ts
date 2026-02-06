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
      // OTIMIZAÇÃO: Paralelizar as 3 queries com Promise.all
      const [sitesResult, metricsResult, configsResult] = await Promise.all([
        supabase
          .from("rank_rent_sites")
          .select("*")
          .eq("owner_user_id", userId),
        supabase
          .from("rank_rent_financial_metrics")
          .select("*")
          .eq("user_id", userId),
        supabase
          .from("rank_rent_financial_config")
          .select("*")
      ]);

      if (sitesResult.error) throw sitesResult.error;
      if (metricsResult.error) throw metricsResult.error;
      if (configsResult.error) throw configsResult.error;

      const sites = sitesResult.data;
      const metrics = metricsResult.data;
      const configs = configsResult.data;

      if (!sites || sites.length === 0) return [];

      // Filtrar configs apenas dos sites do usuário
      const siteIds = new Set(sites.map(s => s.id));
      const userConfigs = configs?.filter(c => siteIds.has(c.site_id)) || [];

      // Criar mapa de sites com suas métricas
      const siteMap = new Map<string, SiteFinancialSummary>();
      
      sites.forEach(site => {
        const siteMetrics = metrics?.filter(m => m.site_id === site.id) || [];
        const siteConfig = userConfigs.find(c => c.site_id === site.id);
        
        // CORREÇÃO: Receita vem do monthly_rent_value do site quando está alugado
        const monthly_revenue = site.is_rented ? Number(site.monthly_rent_value || 0) : 0;
        
        const monthly_costs = siteMetrics.reduce((sum, m) => 
          sum + Number(m.proportional_fixed_cost || 0) + Number(m.monthly_conversion_costs || 0), 0
        );
        
        const total_conversions = siteMetrics.reduce((sum, m) => sum + Number(m.total_conversions || 0), 0);
        const total_pages = siteMetrics.length;

        // Se não tem métricas mas tem configuração, calcular custo fixo
        const effectiveCosts = monthly_costs > 0 ? monthly_costs : Number(siteConfig?.monthly_fixed_costs || 0);
        
        // Lucro = Receita - Custos
        const monthly_profit = monthly_revenue - effectiveCosts;

        siteMap.set(site.id, {
          site_id: site.id,
          site_name: site.site_name,
          site_url: site.site_url,
          client_name: site.client_name,
          client_id: site.client_id,
          is_rented: site.is_rented || false,
          monthly_revenue,
          monthly_costs: effectiveCosts,
          monthly_profit,
          roi_percentage: 0,
          profit_margin: 0,
          total_pages,
          total_conversions,
        });
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
    staleTime: 60000, // 1 minuto de cache
    gcTime: 120000, // 2 minutos em memória
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

    const totalRevenue = sitesMetrics.reduce((sum, s) => sum + s.monthly_revenue, 0);
    const totalCosts = sitesMetrics.reduce((sum, s) => sum + s.monthly_costs, 0);
    const totalProfit = sitesMetrics.reduce((sum, s) => sum + s.monthly_profit, 0);

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      avgROI: totalCosts > 0 ? (totalProfit / totalCosts) * 100 : 0,
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

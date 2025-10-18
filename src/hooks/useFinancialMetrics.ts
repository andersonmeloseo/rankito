import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FinancialConfig {
  id?: string;
  user_id?: string;
  site_id?: string;
  page_id?: string;
  cost_per_conversion: number;
  monthly_fixed_costs: number;
  acquisition_cost: number;
  business_model: "per_page" | "full_site";
  notes?: string;
}

export interface FinancialMetric {
  page_id: string;
  site_id: string;
  page_url: string;
  page_title: string;
  page_path: string;
  monthly_rent_value: number;
  is_rented: boolean;
  client_id: string;
  client_name: string;
  total_conversions: number;
  total_page_views: number;
  conversion_rate: number;
  cost_per_conversion: number;
  monthly_fixed_costs: number;
  acquisition_cost: number;
  proportional_fixed_cost: number;
  business_model: string;
  monthly_revenue: number;
  monthly_conversion_costs: number;
  monthly_profit: number;
  roi_percentage: number;
  cost_revenue_ratio: number;
  profit_margin: number;
}

export const useFinancialMetrics = (siteId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for site-level financial configuration
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["financial-config", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_financial_config")
        .select("*")
        .eq("site_id", siteId)
        .maybeSingle();

      if (error) throw error;
      return data as FinancialConfig | null;
    },
  });

  // Query for calculated financial metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["financial-metrics", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_financial_metrics")
        .select("*")
        .eq("site_id", siteId);

      if (error) throw error;
      return data as FinancialMetric[];
    },
  });

  // Mutation to save configuration
  const saveConfig = useMutation({
    mutationFn: async (config: FinancialConfig) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const configData = {
        ...config,
        user_id: userData.user.id,
        site_id: siteId,
        page_id: null,
      };

      const { data, error } = await supabase
        .from("rank_rent_financial_config")
        .upsert(configData, { 
          onConflict: "site_id",
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-config", siteId] });
      queryClient.invalidateQueries({ queryKey: ["financial-metrics", siteId] });
      toast({
        title: "Configuração salva",
        description: "As configurações financeiras foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate summary metrics
  const summary = {
    totalRevenue: metrics?.reduce((sum, m) => sum + Number(m.monthly_revenue), 0) || 0,
    totalCosts: metrics?.reduce((sum, m) => sum + Number(m.monthly_conversion_costs) + Number(m.proportional_fixed_cost), 0) || 0,
    totalProfit: metrics?.reduce((sum, m) => sum + Number(m.monthly_profit), 0) || 0,
    avgROI: metrics && metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + Number(m.roi_percentage), 0) / metrics.length 
      : 0,
    totalPages: metrics?.length || 0,
    profitablePages: metrics?.filter(m => Number(m.monthly_profit) > 0).length || 0,
  };

  return {
    config,
    metrics: metrics || [],
    summary,
    isLoading: configLoading || metricsLoading,
    saveConfig,
  };
};

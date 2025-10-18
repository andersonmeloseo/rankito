import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SiteFinancialConfig {
  id?: string;
  site_id: string;
  cost_per_conversion: number;
  monthly_fixed_costs: number;
  acquisition_cost: number;
  business_model: string;
  notes?: string;
}

export const useSiteFinancialConfig = (siteId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["site-financial-config", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_financial_config")
        .select("*")
        .eq("site_id", siteId)
        .maybeSingle();

      if (error) throw error;
      return data as SiteFinancialConfig | null;
    },
    enabled: !!siteId,
  });

  const saveConfig = useMutation({
    mutationFn: async (newConfig: Omit<SiteFinancialConfig, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const configData = {
        ...newConfig,
        user_id: user.id,
      };

      if (config?.id) {
        const { data, error } = await supabase
          .from("rank_rent_financial_config")
          .update(configData)
          .eq("id", config.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("rank_rent_financial_config")
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: "Configuração salva",
        description: "Os custos do projeto foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["site-financial-config", siteId] });
      queryClient.invalidateQueries({ queryKey: ["global-financial-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["financial-metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    config,
    isLoading,
    saveConfig,
  };
};

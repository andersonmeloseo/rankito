import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketingCampaignV2 {
  id: string;
  strategy_id: string | null;
  name: string;
  channel: string;
  budget_total: number;
  budget_spent: number;
  leads: number;
  conversions: number;
  cpa: number;
  roi: number;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  start_date: string | null;
  end_date: string | null;
  metrics: unknown;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  strategy_id?: string;
  name: string;
  channel: string;
  budget_total?: number;
  status?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  start_date?: string;
  end_date?: string;
}

export const useMarketingCampaignsV2 = () => {
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["marketing-campaigns-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns_v2")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MarketingCampaignV2[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data, error } = await supabase
        .from("marketing_campaigns_v2")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns-v2"] });
      toast.success("Campanha criada!");
    },
    onError: (error) => {
      toast.error("Erro ao criar campanha: " + error.message);
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<MarketingCampaignV2> & { id: string }) => {
      const { data, error } = await supabase
        .from("marketing_campaigns_v2")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns-v2"] });
      toast.success("Campanha atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_campaigns_v2")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns-v2"] });
      toast.success("Campanha removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  // Calculate totals
  const totalBudget = campaigns?.reduce((sum, c) => sum + c.budget_total, 0) || 0;
  const totalSpent = campaigns?.reduce((sum, c) => sum + c.budget_spent, 0) || 0;
  const totalLeads = campaigns?.reduce((sum, c) => sum + c.leads, 0) || 0;
  const totalConversions = campaigns?.reduce((sum, c) => sum + c.conversions, 0) || 0;
  const avgCPA = totalConversions > 0 ? totalSpent / totalConversions : 0;

  return {
    campaigns,
    isLoading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    totalBudget,
    totalSpent,
    totalLeads,
    totalConversions,
    avgCPA,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketingStrategy {
  id: string;
  name: string;
  channel: string;
  type: string;
  budget_monthly: number;
  target_leads: number;
  target_conversions: number;
  status: string;
  responsible: string | null;
  start_date: string | null;
  end_date: string | null;
  kpis: { name: string; target: string }[];
  notes: string | null;
  learnings: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyInput {
  name: string;
  channel: string;
  type?: string;
  budget_monthly?: number;
  target_leads?: number;
  target_conversions?: number;
  status?: string;
  responsible?: string;
  start_date?: string;
  end_date?: string;
  kpis?: { name: string; target: string }[];
  notes?: string;
  priority?: number;
}

export const useMarketingStrategies = () => {
  const queryClient = useQueryClient();

  const { data: strategies, isLoading } = useQuery({
    queryKey: ["marketing-strategies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_strategies")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as MarketingStrategy[];
    },
  });

  const createStrategy = useMutation({
    mutationFn: async (input: CreateStrategyInput) => {
      const { data, error } = await supabase
        .from("marketing_strategies")
        .insert({
          ...input,
          kpis: input.kpis || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-strategies"] });
      toast.success("Estratégia criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar estratégia: " + error.message);
    },
  });

  const updateStrategy = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<MarketingStrategy> & { id: string }) => {
      const { data, error } = await supabase
        .from("marketing_strategies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-strategies"] });
      toast.success("Estratégia atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteStrategy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_strategies")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-strategies"] });
      toast.success("Estratégia removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  return {
    strategies,
    isLoading,
    createStrategy,
    updateStrategy,
    deleteStrategy,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketingGoal {
  id: string;
  month: number;
  year: number;
  target_leads: number;
  target_conversions: number;
  target_revenue: number;
  actual_leads: number;
  actual_conversions: number;
  actual_revenue: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useMarketingGoals = () => {
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ["marketing-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_goals")
        .select("*")
        .order("year", { ascending: true })
        .order("month", { ascending: true });

      if (error) throw error;
      return data as MarketingGoal[];
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<MarketingGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from("marketing_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-goals"] });
      toast.success("Meta atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar meta: " + error.message);
    },
  });

  const createGoal = useMutation({
    mutationFn: async (input: Omit<MarketingGoal, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("marketing_goals")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-goals"] });
      toast.success("Meta criada!");
    },
    onError: (error) => {
      toast.error("Erro ao criar meta: " + error.message);
    },
  });

  // Calculate totals
  const totalTargetConversions = goals?.reduce((sum, g) => sum + g.target_conversions, 0) || 0;
  const totalActualConversions = goals?.reduce((sum, g) => sum + g.actual_conversions, 0) || 0;
  const progressPercentage = totalTargetConversions > 0 
    ? Math.round((totalActualConversions / totalTargetConversions) * 100) 
    : 0;

  return {
    goals,
    isLoading,
    updateGoal,
    createGoal,
    totalTargetConversions,
    totalActualConversions,
    progressPercentage,
  };
};

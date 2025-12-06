import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type GoalType = 'cta_match' | 'page_destination' | 'url_pattern' | 'combined' | 'scroll_depth' | 'time_on_page';

export interface ConversionGoal {
  id: string;
  site_id: string;
  user_id: string;
  goal_name: string;
  goal_type: GoalType;
  cta_patterns: string[];
  cta_exact_matches: string[];
  page_urls: string[];
  url_patterns: string[];
  conversion_value: number;
  priority: number;
  is_active: boolean;
  min_scroll_depth: number | null;
  min_time_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  site_id: string;
  goal_name: string;
  goal_type: GoalType;
  cta_patterns?: string[];
  cta_exact_matches?: string[];
  page_urls?: string[];
  url_patterns?: string[];
  conversion_value?: number;
  priority?: number;
  is_active?: boolean;
  min_scroll_depth?: number;
  min_time_seconds?: number;
}

export const useConversionGoals = (siteId: string) => {
  const queryClient = useQueryClient();

  const { data: goals, isLoading, error } = useQuery({
    queryKey: ['conversion-goals', siteId],
    queryFn: async (): Promise<ConversionGoal[]> => {
      const { data, error } = await supabase
        .from('conversion_goals')
        .select('*')
        .eq('site_id', siteId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data || []) as ConversionGoal[];
    },
    enabled: !!siteId,
  });

  const createGoal = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('conversion_goals')
        .insert({
          ...input,
          user_id: user.id,
          cta_patterns: input.cta_patterns || [],
          cta_exact_matches: input.cta_exact_matches || [],
          page_urls: input.page_urls || [],
          url_patterns: input.url_patterns || [],
          conversion_value: input.conversion_value || 0,
          priority: input.priority || 50,
          is_active: input.is_active !== undefined ? input.is_active : true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion-goals', siteId] });
      toast.success('Meta de conversão criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating goal:', error);
      toast.error('Erro ao criar meta de conversão');
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConversionGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('conversion_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion-goals', siteId] });
      toast.success('Meta atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating goal:', error);
      toast.error('Erro ao atualizar meta');
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('conversion_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion-goals', siteId] });
      toast.success('Meta removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting goal:', error);
      toast.error('Erro ao remover meta');
    },
  });

  const toggleGoal = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('conversion_goals')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion-goals', siteId] });
    },
    onError: (error) => {
      console.error('Error toggling goal:', error);
      toast.error('Erro ao alterar status da meta');
    },
  });

  return {
    goals: goals || [],
    isLoading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleGoal,
  };
};

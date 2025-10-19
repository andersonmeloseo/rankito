import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PipelineStage {
  id: string;
  user_id: string;
  stage_key: string;
  label: string;
  color: string;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export const usePipelineStages = (userId: string) => {
  const queryClient = useQueryClient();

  const { data: stages, isLoading } = useQuery({
    queryKey: ["pipelineStages", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .select("*")
        .eq("user_id", userId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PipelineStage[];
    },
    enabled: !!userId,
  });

  const createStage = useMutation({
    mutationFn: async (newStage: Omit<PipelineStage, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .insert([{ ...newStage, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelineStages", userId] });
      toast.success("Estágio criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar estágio: " + error.message);
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PipelineStage> }) => {
      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelineStages", userId] });
      toast.success("Estágio atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar estágio: " + error.message);
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_pipeline_stages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelineStages", userId] });
      toast.success("Estágio removido!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover estágio: " + error.message);
    },
  });

  const reorderStages = useMutation({
    mutationFn: async (reorderedStages: { id: string; display_order: number }[]) => {
      const updates = reorderedStages.map(({ id, display_order }) =>
        supabase
          .from("crm_pipeline_stages")
          .update({ display_order })
          .eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelineStages", userId] });
      toast.success("Ordem atualizada!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao reordenar: " + error.message);
    },
  });

  return {
    stages,
    isLoading,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
};

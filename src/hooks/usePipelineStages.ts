import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errorMessages";

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

  const { data: stages, isLoading, error, refetch } = useQuery({
    queryKey: ["pipelineStages", userId],
    queryFn: async () => {
      console.log("🔍 Buscando estágios do pipeline para userId:", userId);
      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .select("*")
        .eq("user_id", userId)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("❌ Erro ao buscar estágios:", error);
        throw error;
      }
      
      console.log("✅ Estágios encontrados:", data?.length || 0, data);
      return data as PipelineStage[];
    },
    enabled: !!userId,
  });

  // Log adicional quando stages muda
  if (stages) {
    console.log("📊 Estágios ativos carregados:", stages.filter(s => s.is_active).length, "de", stages.length);
  }

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
      const errorMsg = getErrorMessage(error, 'criar estágio');
      toast.error(errorMsg.title, { description: errorMsg.description });
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
      const errorMsg = getErrorMessage(error, 'atualizar estágio');
      toast.error(errorMsg.title, { description: errorMsg.description });
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
      const errorMsg = getErrorMessage(error, 'remover estágio');
      toast.error(errorMsg.title, { description: errorMsg.description });
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
      const errorMsg = getErrorMessage(error, 'reordenar estágios');
      toast.error(errorMsg.title, { description: errorMsg.description });
    },
  });

  return {
    stages,
    isLoading,
    error,
    refetch,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
};

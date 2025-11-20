import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTrainingModules = () => {
  return useQuery({
    queryKey: ["training-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_modules")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as TrainingModule[];
    },
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (module: Omit<TrainingModule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("training_modules")
        .insert(module)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-modules"] });
      toast.success("Módulo criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar módulo");
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingModule> & { id: string }) => {
      const { data, error } = await supabase
        .from("training_modules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-modules"] });
      toast.success("Módulo atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar módulo");
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_modules")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-modules"] });
      toast.success("Módulo excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir módulo");
    },
  });
};

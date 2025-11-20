import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrainingVideo {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_provider: "wistia" | "youtube" | "vimeo";
  video_id: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
  is_free: boolean;
  created_at: string;
  updated_at: string;
}

export const useTrainingVideos = (moduleId?: string) => {
  return useQuery({
    queryKey: ["training-videos", moduleId],
    queryFn: async () => {
      let query = supabase
        .from("training_videos")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (moduleId) {
        query = query.eq("module_id", moduleId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TrainingVideo[];
    },
  });
};

export const useCreateVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (video: Omit<TrainingVideo, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("training_videos")
        .insert(video)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-videos"] });
      toast.success("Vídeo criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar vídeo");
    },
  });
};

export const useUpdateVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingVideo> & { id: string }) => {
      const { data, error } = await supabase
        .from("training_videos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-videos"] });
      toast.success("Vídeo atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar vídeo");
    },
  });
};

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_videos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-videos"] });
      toast.success("Vídeo excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir vídeo");
    },
  });
};

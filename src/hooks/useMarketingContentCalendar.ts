import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  channel: string | null;
  status: string;
  scheduled_date: string | null;
  published_date: string | null;
  target_keywords: string[] | null;
  url: string | null;
  metrics: Json | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContentInput {
  title: string;
  type?: string;
  channel?: string;
  status?: string;
  scheduled_date?: string;
  target_keywords?: string[];
  notes?: string;
}

export const useMarketingContentCalendar = () => {
  const queryClient = useQueryClient();

  const { data: content, isLoading } = useQuery({
    queryKey: ["marketing-content-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_content_calendar")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data as ContentItem[];
    },
  });

  const createContent = useMutation({
    mutationFn: async (input: CreateContentInput) => {
      const { data, error } = await supabase
        .from("marketing_content_calendar")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-content-calendar"] });
      toast.success("Conteúdo adicionado!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar: " + error.message);
    },
  });

  const updateContent = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ContentItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("marketing_content_calendar")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-content-calendar"] });
      toast.success("Conteúdo atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_content_calendar")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-content-calendar"] });
      toast.success("Conteúdo removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  // Group by status
  const contentByStatus = {
    idea: content?.filter((c) => c.status === "idea") || [],
    draft: content?.filter((c) => c.status === "draft") || [],
    review: content?.filter((c) => c.status === "review") || [],
    published: content?.filter((c) => c.status === "published") || [],
  };

  return {
    content,
    isLoading,
    createContent,
    updateContent,
    deleteContent,
    contentByStatus,
  };
};

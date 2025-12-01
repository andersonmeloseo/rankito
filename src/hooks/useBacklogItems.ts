import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BacklogItem {
  id: string;
  title: string;
  description: string | null;
  category: 'new_feature' | 'improvement' | 'bugfix' | 'security';
  status: 'planned' | 'in_progress' | 'testing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_start_date: string | null;
  estimated_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  progress_percentage: number;
  release_version: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useBacklogItems = () => {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['backlog-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_backlog')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BacklogItem[];
    },
  });

  const createItem = useMutation({
    mutationFn: async (item: { 
      title: string; 
      description?: string | null; 
      category?: 'new_feature' | 'improvement' | 'bugfix' | 'security';
      status?: 'planned' | 'in_progress' | 'testing' | 'completed' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      estimated_start_date?: string | null;
      estimated_end_date?: string | null;
      progress_percentage?: number;
      release_version?: string | null;
      is_public?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('product_backlog')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast.success('Feature criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar feature: ${error.message}`);
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BacklogItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_backlog')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast.success('Feature atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_backlog')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast.success('Feature removida!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  return {
    items: items || [],
    isLoading,
    createItem: createItem.mutate,
    updateItem: updateItem.mutate,
    deleteItem: deleteItem.mutate,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExternalSource {
  id: string;
  user_id: string;
  source_type: 'wordpress' | 'chrome_extension' | 'api' | 'manual';
  source_name: string;
  api_token: string;
  site_url: string | null;
  is_active: boolean;
  settings: Record<string, any>;
  stats: {
    total_leads: number;
    last_lead_at: string | null;
  };
  created_at: string;
  updated_at: string;
}

export const useExternalSources = (userId: string) => {
  const queryClient = useQueryClient();

  const { data: sources, isLoading } = useQuery({
    queryKey: ['external-sources', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_lead_sources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExternalSource[];
    },
    enabled: !!userId,
  });

  const createSource = useMutation({
    mutationFn: async (newSource: {
      source_type: 'wordpress' | 'chrome_extension' | 'api';
      source_name: string;
      site_url?: string;
      settings?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('external_lead_sources')
        .insert({
          user_id: userId,
          ...newSource,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['external-sources', userId] });
      toast.success('Integração criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar integração: ' + error.message);
    },
  });

  const updateSource = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExternalSource> }) => {
      const { data, error } = await supabase
        .from('external_lead_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-sources', userId] });
      toast.success('Integração atualizada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('external_lead_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-sources', userId] });
      toast.success('Integração removida!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('external_lead_sources')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['external-sources', userId] });
      toast.success(variables.is_active ? 'Integração ativada!' : 'Integração desativada!');
    },
  });

  return {
    sources,
    isLoading,
    createSource: createSource.mutate,
    updateSource: updateSource.mutate,
    deleteSource: deleteSource.mutate,
    toggleActive: toggleActive.mutate,
    isCreating: createSource.isPending,
    isUpdating: updateSource.isPending,
    isDeleting: deleteSource.isPending,
  };
};

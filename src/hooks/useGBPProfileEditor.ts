import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGBPProfileEditor = (profileId: string) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['gbp-profile-editor', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_business_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('google_business_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-profile-editor', profileId] });
      queryClient.invalidateQueries({ queryKey: ['gbp-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['gbp-site-profiles'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
  };
};

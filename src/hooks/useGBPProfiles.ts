import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useGBPProfiles(siteId: string, userId: string) {
  const queryClient = useQueryClient();

  // Fetch GBP profiles
  const profiles = useQuery({
    queryKey: ['gbp-profiles', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_business_profiles')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch plan limits
  const planLimits = useQuery({
    queryKey: ['gbp-plan-limits', userId, siteId],
    queryFn: async () => {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          subscription_plans!inner(
            name,
            max_gbp_integrations
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: currentCount } = await supabase
        .from('google_business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);

      const maxIntegrations = (subscription as any)?.subscription_plans?.max_gbp_integrations;
      const canAddMore = maxIntegrations === null || (currentCount || 0) < maxIntegrations;

      return {
        subscription,
        maxIntegrations,
        currentCount: currentCount || 0,
        canAddMore,
      };
    },
    enabled: !!userId && !!siteId,
  });

  // Test connection
  const testConnection = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke('gbp-test-connection', {
        body: { profile_id: profileId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Conexão testada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-profiles'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro no teste de conexão');
    },
  });

  // Delete profile
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke('gbp-delete-profile', {
        body: { profile_id: profileId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Perfil GBP removido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['gbp-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['gbp-plan-limits'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover perfil');
    },
  });

  // Sync reviews manually
  const syncReviews = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gbp-sync-reviews');

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Avaliações sincronizadas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-reviews'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar avaliações');
    },
  });

  return {
    profiles: profiles.data,
    isLoading: profiles.isLoading,
    planLimits: planLimits.data,
    testConnection,
    isTesting: testConnection.isPending,
    deleteProfile,
    isDeleting: deleteProfile.isPending,
    syncReviews,
    isSyncing: syncReviews.isPending,
    refetch: profiles.refetch,
  };
}

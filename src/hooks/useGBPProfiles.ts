import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGBPProfiles = (siteId: string, userId: string) => {
  const queryClient = useQueryClient();

  // Fetch GBP profiles for site
  const { data: profiles, isLoading } = useQuery({
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
  const { data: planLimits } = useQuery({
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

      return {
        subscription,
        maxIntegrations: (subscription as any)?.subscription_plans?.max_gbp_integrations ?? 0,
        currentCount: currentCount || 0,
      };
    },
    enabled: !!userId && !!siteId,
  });

  // Start OAuth flow
  const startOAuth = useMutation({
    mutationFn: async (connectionName: string) => {
      const { data, error } = await supabase.functions.invoke('gbp-oauth-start', {
        body: { site_id: siteId, connection_name: connectionName },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao iniciar OAuth: ${error.message}`);
    },
  });

  // Test connection
  const testConnection = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke('gbp-test-connection', {
        body: { profile_id: profileId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Conexão testada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-profiles'] });
    },
    onError: (error: any) => {
      toast.error(`Erro no teste: ${error.message}`);
    },
  });

  // Delete profile
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke('gbp-delete-profile', {
        body: { profile_id: profileId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Perfil GBP removido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['gbp-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['gbp-plan-limits'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover perfil: ${error.message}`);
    },
  });

  // Sync reviews manually
  const syncReviews = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gbp-sync-reviews', {
        body: {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Avaliações sincronizadas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gbp-reviews'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });

  return {
    profiles,
    planLimits,
    isLoading,
    isStartingOAuth: startOAuth.isPending,
    isTestingConnection: testConnection.isPending,
    isDeletingProfile: deleteProfile.isPending,
    isSyncingReviews: syncReviews.isPending,
    startOAuth: startOAuth.mutate,
    testConnection: testConnection.mutate,
    deleteProfile: deleteProfile.mutate,
    syncReviews: syncReviews.mutate,
  };
};

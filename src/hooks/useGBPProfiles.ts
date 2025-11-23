import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Hook para gerenciar perfis GBP do usuário (global, não por site)
export function useGBPProfiles(userId: string) {
  const queryClient = useQueryClient();

  // Fetch GBP profiles do usuário
  const profiles = useQuery({
    queryKey: ['gbp-profiles', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_business_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch plan limits
  const planLimits = useQuery({
    queryKey: ['gbp-plan-limits', userId],
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
        .eq('user_id', userId);

      const maxIntegrations = (subscription as any)?.subscription_plans?.max_gbp_integrations;
      const canAddMore = maxIntegrations === null || (currentCount || 0) < maxIntegrations;

      return {
        subscription,
        maxIntegrations,
        currentCount: currentCount || 0,
        canAddMore,
      };
    },
    enabled: !!userId,
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

// Novo hook para gerenciar perfis GBP de um site específico
export function useGBPSiteProfiles(siteId: string, userId: string) {
  const queryClient = useQueryClient();

  const siteProfiles = useQuery({
    queryKey: ['gbp-site-profiles', siteId],
    queryFn: async () => {
      // Buscar associações do site
      const { data: associations, error: assocError } = await supabase
        .from('gbp_site_associations')
        .select(`
          *,
          google_business_profiles(*)
        `)
        .eq('site_id', siteId);

      if (assocError) throw assocError;

      return associations?.map(a => a.google_business_profiles).filter(Boolean) || [];
    },
    enabled: !!siteId,
  });

  // Associar perfil ao site
  const associateProfile = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('gbp_site_associations')
        .insert({
          gbp_profile_id: profileId,
          site_id: siteId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Perfil GBP associado ao projeto');
      queryClient.invalidateQueries({ queryKey: ['gbp-site-profiles', siteId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao associar perfil');
    },
  });

  // Desassociar perfil do site
  const dissociateProfile = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('gbp_site_associations')
        .delete()
        .eq('gbp_profile_id', profileId)
        .eq('site_id', siteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Perfil GBP desassociado do projeto');
      queryClient.invalidateQueries({ queryKey: ['gbp-site-profiles', siteId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao desassociar perfil');
    },
  });

  return {
    profiles: siteProfiles.data,
    isLoading: siteProfiles.isLoading,
    associateProfile,
    isAssociating: associateProfile.isPending,
    dissociateProfile,
    isDissociating: dissociateProfile.isPending,
  };
}

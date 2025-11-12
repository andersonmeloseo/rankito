import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type GSCIntegration = Database['public']['Tables']['google_search_console_integrations']['Row'];

interface CreateGSCIntegrationInput {
  site_id: string;
  connection_name: string;
  google_email: string;
  google_client_id: string;
  google_client_secret: string;
}

export const useGSCIntegrations = (siteId: string, userId: string) => {
  const queryClient = useQueryClient();

  // Buscar integrações do site
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['gsc-integrations', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_search_console_integrations')
        .select('*')
        .eq('site_id', siteId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GSCIntegration[];
    },
    enabled: !!siteId && !!userId,
  });

  // Verificar limites do plano
  const { data: planLimits } = useQuery({
    queryKey: ['gsc-plan-limits', userId],
    queryFn: async () => {
      // Buscar assinatura ativa do usuário
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            slug,
            max_gsc_integrations
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const plan = subscription?.subscription_plans as any;

      // Contar integrações atuais do site
      const { count: currentCount } = await supabase
        .from('google_search_console_integrations')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('user_id', userId);

      // Calcular limites
      const maxIntegrations = plan?.max_gsc_integrations;
      const isUnlimited = maxIntegrations === null;
      const canAddIntegration = isUnlimited || (currentCount || 0) < (maxIntegrations || 0);
      const remainingIntegrations = isUnlimited 
        ? null 
        : (maxIntegrations || 0) - (currentCount || 0);

      return {
        planName: plan?.name || 'Free',
        planSlug: plan?.slug || 'free',
        maxIntegrations,
        currentCount: currentCount || 0,
        isUnlimited,
        canAddIntegration,
        remainingIntegrations,
      };
    },
    enabled: !!siteId && !!userId,
  });

  // Criar nova integração
  const createIntegration = useMutation({
    mutationFn: async (input: CreateGSCIntegrationInput) => {
      // Verificar limite antes de criar
      if (planLimits && !planLimits.canAddIntegration) {
        throw new Error(
          `Limite de ${planLimits.maxIntegrations} integrações GSC atingido para o plano ${planLimits.planName}. ` +
          `Faça upgrade para adicionar mais integrações.`
        );
      }

      const { data, error } = await supabase
        .from('google_search_console_integrations')
        .insert([{
          user_id: userId,
          site_id: input.site_id,
          connection_name: input.connection_name,
          google_email: input.google_email,
          google_client_id: input.google_client_id,
          google_client_secret: input.google_client_secret,
          is_active: false,
          access_token: '',
          refresh_token: '',
          gsc_property_url: '',
          token_expires_at: null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-integrations', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-plan-limits', userId] });
      toast.success('Integração GSC criada! Agora conclua a autenticação OAuth.');
      return data;
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar integração: ${error.message}`);
    },
  });

  // Iniciar fluxo OAuth
  const startOAuth = useMutation({
    mutationFn: async (integrationId: string) => {
      // Chamar edge function para gerar URL de autorização
      const { data, error } = await supabase.functions.invoke('gsc-oauth-init', {
        body: { integration_id: integrationId, site_id: siteId },
      });

      if (error) throw error;
      if (!data?.authUrl) throw new Error('URL de autorização não recebida');

      // Redirecionar para Google OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast.error(`Erro ao iniciar OAuth: ${error.message}`);
    },
  });

  // Deletar integração
  const deleteIntegration = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('google_search_console_integrations')
        .delete()
        .eq('id', integrationId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-integrations', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-plan-limits', userId] });
      toast.success('Integração GSC removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover integração: ${error.message}`);
    },
  });

  // Atualizar integração
  const updateIntegration = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<GSCIntegration> 
    }) => {
      const { error } = await supabase
        .from('google_search_console_integrations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-integrations', siteId] });
      toast.success('Integração atualizada!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  return {
    // Data
    integrations,
    isLoading,
    planLimits,

    // Mutations
    createIntegration: createIntegration.mutate,
    startOAuth: startOAuth.mutate,
    deleteIntegration: deleteIntegration.mutate,
    updateIntegration: updateIntegration.mutate,

    // Loading states
    isCreating: createIntegration.isPending,
    isStartingOAuth: startOAuth.isPending,
    isDeleting: deleteIntegration.isPending,
    isUpdating: updateIntegration.isPending,
  };
};

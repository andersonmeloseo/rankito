import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type GSCIntegration = Database['public']['Tables']['google_search_console_integrations']['Row'];

interface CreateGSCIntegrationInput {
  siteId: string;
  connectionName: string;
  serviceAccountJson: any;
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
        .maybeSingle();

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

  // Criar nova integração com Service Account
  const createIntegration = useMutation({
    mutationFn: async (input: CreateGSCIntegrationInput) => {
      // Verificar limite antes de criar
      if (planLimits && !planLimits.canAddIntegration) {
        throw new Error(
          planLimits.isUnlimited
            ? "Erro ao verificar limite do plano"
            : `Limite atingido: seu plano permite ${planLimits.maxIntegrations} integração(ões)`
        );
      }

      // Extrair client_email do JSON da Service Account
      const clientEmail = input.serviceAccountJson.client_email;
      if (!clientEmail) {
        throw new Error("Service Account JSON inválido: client_email não encontrado");
      }

      // Inserir integração
      const { data, error } = await supabase
        .from('google_search_console_integrations')
        .insert([{
          user_id: userId,
          site_id: input.siteId,
          connection_name: input.connectionName,
          google_email: clientEmail,
          service_account_json: input.serviceAccountJson,
          is_active: true, // Service Account é imediatamente ativa
          gsc_property_url: '', // Será preenchido quando o usuário selecionar uma propriedade
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-integrations', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-plan-limits', userId] });
      toast.success('✅ Integração criada com sucesso! Service Account conectada e pronta para uso.');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar integração: ${error.message}`);
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
    integrations: integrations || [],
    planLimits,
    isLoading,
    createIntegration,
    deleteIntegration,
    updateIntegration,
    isCreating: createIntegration.isPending,
    isDeleting: deleteIntegration.isPending,
    isUpdating: updateIntegration.isPending,
  };
};

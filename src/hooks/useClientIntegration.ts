import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ClientWithPortalStatus {
  client_id: string;
  user_id: string;
  client_name: string;
  email?: string;
  phone?: string;
  company?: string;
  niche?: string;
  notes?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  created_at: string;
  updated_at: string;
  portal_enabled?: boolean;
  portal_token?: string;
  portal_created_at?: string;
  end_client_user_id?: string;
  end_client_email?: string;
  end_client_active?: boolean;
  conversions_30d: number;
  page_views_30d: number;
  total_sites: number;
  total_pages: number;
  total_monthly_value: number;
}

export const useClientIntegration = (userId: string) => {
  const queryClient = useQueryClient();

  // Fetch clients with portal status from the new view
  const { data: clients, isLoading } = useQuery<ClientWithPortalStatus[]>({
    queryKey: ["clients-integrated", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_portal_status")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching clients:", error);
        throw error;
      }

      return data as ClientWithPortalStatus[];
    },
    staleTime: 60000,
    refetchInterval: 120000, // 2 minutos ao invés de 30s
  });

  // Toggle portal activation
  const togglePortal = useMutation({
    mutationFn: async ({ clientId, enabled }: { clientId: string; enabled: boolean }) => {
      // Check if portal analytics entry exists
      const { data: existing } = await supabase
        .from("client_portal_analytics")
        .select("id, enabled")
        .eq("client_id", clientId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("client_portal_analytics")
          .update({ enabled, updated_at: new Date().toISOString() })
          .eq("client_id", clientId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("client_portal_analytics")
          .insert({
            user_id: userId,
            client_id: clientId,
            enabled: true,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients-integrated"] });
      toast({
        title: variables.enabled ? "Portal ativado!" : "Portal desativado",
        description: variables.enabled 
          ? "O cliente agora pode acessar o dashboard de analytics"
          : "O acesso ao portal foi desativado",
      });
    },
    onError: (error) => {
      console.error("Error toggling portal:", error);
      toast({
        title: "Erro ao alterar portal",
        description: "Não foi possível alterar o status do portal",
        variant: "destructive",
      });
    },
  });

  // Copy portal link
  const copyPortalLink = (client: ClientWithPortalStatus) => {
    if (!client.portal_enabled || !client.portal_token) {
      toast({
        title: "Portal não ativado",
        description: "Ative o portal primeiro para gerar o link",
        variant: "destructive",
      });
      return;
    }

    const url = `${import.meta.env.VITE_APP_URL}/client-portal/${client.portal_token}`;
    navigator.clipboard.writeText(url);

    toast({
      title: "Link copiado!",
      description: "Link do portal copiado para área de transferência",
    });
  };

  // Open portal in new tab
  const openPortal = (client: ClientWithPortalStatus) => {
    if (!client.portal_enabled || !client.portal_token) {
      toast({
        title: "Portal não ativado",
        description: "Ative o portal primeiro",
        variant: "destructive",
      });
      return;
    }

    const url = `${import.meta.env.VITE_APP_URL}/client-portal/${client.portal_token}`;
    window.open(url, '_blank');
  };

  return {
    clients,
    isLoading,
    togglePortal,
    copyPortalLink,
    openPortal,
  };
};

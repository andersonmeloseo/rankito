import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateEndClientParams {
  email: string;
  password: string;
  full_name: string;
  client_id: string;
}

interface ResetPasswordParams {
  end_client_user_id: string;
}

export const useEndClientManagement = (clientId?: string) => {
  const queryClient = useQueryClient();

  // Buscar end-client existente para um cliente
  const { data: endClientUser, isLoading } = useQuery({
    queryKey: ["end-client-user", clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at, last_activity_at")
        .eq("parent_user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Criar end-client
  const createEndClient = useMutation({
    mutationFn: async (params: CreateEndClientParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("create-end-client", {
        body: params,
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["end-client-user"] });
      toast({
        title: "Acesso criado com sucesso!",
        description: "As credenciais foram geradas. Compartilhe com seu cliente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar acesso",
        description: error.message || "Não foi possível criar o acesso do cliente",
        variant: "destructive",
      });
    },
  });

  // Resetar senha
  const resetPassword = useMutation({
    mutationFn: async (params: ResetPasswordParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("reset-end-client-password", {
        body: params,
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Senha redefinida!",
        description: "Uma nova senha temporária foi gerada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Não foi possível redefinir a senha",
        variant: "destructive",
      });
    },
  });

  // Revogar acesso (desativar usuário)
  const revokeAccess = useMutation({
    mutationFn: async (endClientUserId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", endClientUserId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["end-client-user"] });
      toast({
        title: "Acesso revogado",
        description: "O usuário não poderá mais acessar o portal.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao revogar acesso",
        description: error.message || "Não foi possível revogar o acesso",
        variant: "destructive",
      });
    },
  });

  return {
    endClientUser,
    isLoading,
    createEndClient,
    resetPassword,
    revokeAccess,
  };
};

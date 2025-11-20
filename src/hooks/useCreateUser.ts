import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logAuditAction } from "@/lib/auditLog";

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: 'client' | 'end_client' | 'super_admin';
  plan_id?: string;
  company?: string;
  whatsapp?: string;
  website?: string;
  country_code?: string;
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserInput) => {
      console.log('🚀 Creating user:', userData.email);
      
      const { data, error } = await supabase.functions.invoke(
        'super-admin-create-user',
        { body: userData }
      );

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('❌ Function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ User created successfully:', data);

      await logAuditAction({
        action: 'user_created',
        targetUserId: data?.userId,
        details: {
          email: userData.email,
          role: userData.role,
          planId: userData.plan_id,
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      
      toast({
        title: "Usuário criado com sucesso!",
        description: "O novo usuário já pode fazer login no sistema.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Mutation error:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário",
        variant: "destructive",
      });
    },
  });

  return {
    createUser: createUserMutation.mutate,
    isCreating: createUserMutation.isPending,
  };
};

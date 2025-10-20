import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAdminPasswordReset = () => {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ new_password: newPassword }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao alterar senha');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Senha alterada com sucesso',
        description: 'Você pode fazer login com a nova senha.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

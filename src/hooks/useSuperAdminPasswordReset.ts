import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useSuperAdminPasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);

  const resetUserPassword = async (email: string, newPassword: string, adminSecret: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-reset-password', {
        body: {
          email,
          new_password: newPassword,
          admin_secret: adminSecret,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Senha resetada com sucesso",
        description: `A senha do usuário ${email} foi atualizada.`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro ao resetar senha",
        description: error.message || "Ocorreu um erro ao resetar a senha",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    resetUserPassword,
    isLoading,
  };
};

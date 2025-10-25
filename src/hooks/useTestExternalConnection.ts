import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTestExternalConnection() {
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async (apiToken: string, sourceName: string) => {
    setIsTesting(true);
    
    try {
      // Validate token
      const { data: source, error } = await supabase
        .from('external_lead_sources')
        .select('source_name, source_type, is_active, user_id')
        .eq('api_token', apiToken)
        .single();

      if (error || !source) {
        toast.error(
          "❌ Token inválido",
          {
            description: "O token fornecido não existe ou está inativo",
          }
        );
        return { success: false, error: 'Token inválido' };
      }

      if (!source.is_active) {
        toast.warning(
          "⚠️ Integração desativada",
          {
            description: "A integração existe mas está desativada. Ative-a para receber leads.",
          }
        );
        return { success: false, error: 'Integração desativada' };
      }

      toast.success(
        `✅ Conexão ativa!`,
        {
          description: `A integração "${sourceName}" está funcionando corretamente.`,
        }
      );
      
      return { 
        success: true, 
        integration_name: source.source_name,
        integration_type: source.source_type,
        is_active: source.is_active
      };

    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error(
        "Erro ao testar conexão",
        {
          description: error instanceof Error ? error.message : "Erro desconhecido",
        }
      );
      return { success: false, error };
    } finally {
      setIsTesting(false);
    }
  };

  return { testConnection, isTesting };
}

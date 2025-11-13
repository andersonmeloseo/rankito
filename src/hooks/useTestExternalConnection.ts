import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage, CONTEXT_ERRORS } from "@/utils/errorMessages";

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
        const errorMsg = CONTEXT_ERRORS.tracking.invalid_token;
        toast.error(
          errorMsg.title,
          {
            description: errorMsg.description,
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
      const errorMsg = getErrorMessage(error, 'testar conexão');
      toast.error(
        errorMsg.title,
        {
          description: errorMsg.description,
        }
      );
      return { success: false, error };
    } finally {
      setIsTesting(false);
    }
  };

  return { testConnection, isTesting };
}

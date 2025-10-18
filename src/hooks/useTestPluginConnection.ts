import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTestPluginConnection() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const testConnection = async (siteId: string, siteName: string) => {
    setIsTestingConnection(true);
    
    try {
      // Buscar conversões dos últimos 10 minutos
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: recentConversions, error } = await supabase
        .from('rank_rent_conversions')
        .select('id, created_at, event_type, page_url')
        .eq('site_id', siteId)
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (recentConversions && recentConversions.length > 0) {
        // Atualizar status do plugin
        const { error: updateError } = await supabase
          .from('rank_rent_sites')
          .update({ tracking_pixel_installed: true })
          .eq('id', siteId);

        if (updateError) throw updateError;

        toast.success(
          `✅ Conexão ativa!`,
          {
            description: `${recentConversions.length} evento(s) detectado(s) nos últimos 10 minutos em ${siteName}`,
          }
        );
        
        return { success: true, events: recentConversions.length };
      } else {
        // Sem eventos recentes - verificar se tem eventos mais antigos
        const { data: olderConversions, error: olderError } = await supabase
          .from('rank_rent_conversions')
          .select('id, created_at')
          .eq('site_id', siteId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (olderError) throw olderError;

        if (olderConversions && olderConversions.length > 0) {
          const lastEvent = new Date(olderConversions[0].created_at);
          const minutesAgo = Math.round((Date.now() - lastEvent.getTime()) / 60000);
          
          toast.warning(
            `⚠️ Sem eventos recentes`,
            {
              description: `Último evento detectado há ${minutesAgo} minutos. Verifique se o plugin está ativo.`,
            }
          );
        } else {
          toast.error(
            `❌ Plugin não detectado`,
            {
              description: `Nenhum evento registrado ainda em ${siteName}. Verifique a instalação do plugin.`,
            }
          );
        }
        
        return { success: false, events: 0 };
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error(
        "Erro ao testar conexão",
        {
          description: error instanceof Error ? error.message : "Erro desconhecido",
        }
      );
      return { success: false, events: 0, error };
    } finally {
      setIsTestingConnection(false);
    }
  };

  return { testConnection, isTestingConnection };
}

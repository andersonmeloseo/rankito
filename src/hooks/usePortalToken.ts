import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PortalAnalytics {
  id: string;
  portal_token: string;
  enabled: boolean;
  report_config: any;
  created_at: string;
}

export const usePortalToken = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generatePortalLink = async (clientId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if portal already exists
      const { data: existing } = await supabase
        .from('client_portal_analytics')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        return existing as PortalAnalytics;
      }

      // Create new portal
      const { data, error } = await supabase
        .from('client_portal_analytics')
        .insert({
          user_id: user.id,
          client_id: clientId,
          enabled: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Portal criado!",
        description: "Link do portal analítico gerado com sucesso.",
      });

      return data as PortalAnalytics;
    } catch (error: any) {
      console.error('Error generating portal:', error);
      toast({
        title: "Erro ao gerar portal",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const togglePortalStatus = async (portalId: string, enabled: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_portal_analytics')
        .update({ enabled })
        .eq('id', portalId);

      if (error) throw error;

      toast({
        title: enabled ? "Portal ativado" : "Portal desativado",
        description: `O portal foi ${enabled ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error toggling portal:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const regenerateToken = async (portalId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_portal_analytics')
        .update({ 
          portal_token: crypto.randomUUID() 
        })
        .eq('id', portalId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Token regenerado!",
        description: "Novo link do portal criado com sucesso.",
      });

      return data as PortalAnalytics;
    } catch (error: any) {
      console.error('Error regenerating token:', error);
      toast({
        title: "Erro ao regenerar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPortalByClient = async (clientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('client_portal_analytics')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as PortalAnalytics | null;
    } catch (error: any) {
      console.error('Error fetching portal:', error);
      return null;
    }
  };

  return {
    loading,
    generatePortalLink,
    togglePortalStatus,
    regenerateToken,
    getPortalByClient,
  };
};

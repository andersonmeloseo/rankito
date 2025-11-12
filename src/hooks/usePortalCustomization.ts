import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PortalSettings {
  branding: {
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    company_name: string;
    tagline: string;
  };
  texts: {
    welcome_title: string;
    welcome_description: string;
    footer_text: string;
    support_email: string;
    support_phone: string;
  };
  features: {
    show_financial: boolean;
    show_reports: boolean;
    enable_export: boolean;
  };
}

export const getDefaultPortalSettings = (): PortalSettings => ({
  branding: {
    logo_url: null,
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    accent_color: '#6366f1',
    company_name: '',
    tagline: ''
  },
  texts: {
    welcome_title: 'Portal de Analytics',
    welcome_description: 'Acompanhe o desempenho em tempo real',
    footer_text: '© 2025. Todos os direitos reservados.',
    support_email: '',
    support_phone: ''
  },
  features: {
    show_financial: true,
    show_reports: true,
    enable_export: true
  }
});

export const usePortalCustomization = (clientId: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['portal-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_portal_analytics')
        .select('id, report_config')
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) {
        return {
          portalId: null,
          settings: getDefaultPortalSettings()
        };
      }
      
      return {
        portalId: data.id,
        settings: (data.report_config as unknown as PortalSettings) || getDefaultPortalSettings()
      };
    },
    enabled: !!clientId,
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: PortalSettings) => {
      const { error } = await supabase
        .from('client_portal_analytics')
        .update({ report_config: newSettings as any })
        .eq('client_id', clientId);
      
      if (error) throw error;
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-settings', clientId] });
      // Invalida também portal-auth para forçar revalidação das customizações
      queryClient.invalidateQueries({ queryKey: ['portal-auth'] });
      toast({
        title: "✅ Configurações salvas!",
        description: "As customizações foram atualizadas. O portal será atualizado automaticamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating portal settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `portal-logo-${clientId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return publicUrl;
    },
    onError: (error) => {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do logo.",
        variant: "destructive",
      });
    },
  });

  return {
    settings: data?.settings,
    portalId: data?.portalId,
    isLoading,
    updateSettings: updateSettings.mutateAsync,
    uploadLogo: uploadLogo.mutateAsync,
    isUpdating: updateSettings.isPending,
    isUploading: uploadLogo.isPending,
    isSuccess: updateSettings.isSuccess,
    resetMutation: updateSettings.reset,
  };
};

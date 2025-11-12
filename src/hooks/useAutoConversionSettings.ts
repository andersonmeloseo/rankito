import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutoConversionSettings {
  id?: string;
  user_id?: string;
  enabled: boolean;
  whatsapp_click_enabled: boolean;
  phone_click_enabled: boolean;
  form_submit_enabled: boolean;
  email_click_enabled: boolean;
  whatsapp_score: number;
  phone_score: number;
  form_score: number;
  email_score: number;
  default_stage: string;
}

export const useAutoConversionSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['auto-conversion-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('auto_conversion_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Se não existe, retornar defaults
      if (!data) {
        return {
          enabled: false,
          whatsapp_click_enabled: true,
          phone_click_enabled: true,
          form_submit_enabled: true,
          email_click_enabled: false,
          whatsapp_score: 80,
          phone_score: 70,
          form_score: 90,
          email_score: 50,
          default_stage: 'lead',
        } as AutoConversionSettings;
      }

      return data as AutoConversionSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<AutoConversionSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('auto_conversion_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('auto_conversion_settings')
          .update(newSettings)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('auto_conversion_settings')
          .insert({
            user_id: user.id,
            ...newSettings,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-conversion-settings'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de auto-conversão foram atualizadas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};

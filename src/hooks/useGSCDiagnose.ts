import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGSCDiagnose = () => {
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('gsc-diagnose-auth', {
        body: { integrationId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('📊 Diagnóstico completo:', data);
    },
    onError: (error: any) => {
      console.error('❌ Erro no diagnóstico:', error);
      toast.error('Erro ao executar diagnóstico');
    },
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePortalAuth = (token: string | undefined) => {
  return useQuery({
    queryKey: ['portal-auth', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('Token não fornecido');
      }

      console.log('[Portal Auth] 🚀 Validando token via Edge Function:', token.substring(0, 10) + '...');

      // Chama Edge Function em vez de query direta
      const { data, error } = await supabase.functions.invoke('validate-portal-token', {
        body: { token }
      });

      console.log('[Portal Auth] 📦 Resposta da Edge Function:', {
        hasData: !!data,
        hasError: !!error,
        clientId: data?.clientId,
        isValid: data?.isValid,
        clientName: data?.clientData?.name,
        error: error?.message
      });

      if (error) {
        console.error('[Portal Auth] ❌ Erro na Edge Function:', error);
        throw new Error(error.message || 'Erro ao validar token');
      }

      if (!data || !data.isValid) {
        console.warn('[Portal Auth] ⚠️ Token inválido ou portal desativado');
        throw new Error('Token inválido ou portal desativado');
      }

      console.log('[Portal Auth] ✅ Token válido para cliente:', data.clientData?.name);

      return {
        portalData: data.portalData,
        clientData: data.clientData,
        clientId: data.clientId,
        customization: data.portalData?.report_config || {},
        isValid: true,
      };
    },
    enabled: !!token,
    staleTime: 5000, // 5 segundos - permite revalidação rápida após customizações
    retry: 2,
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Validação de UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const usePortalAuth = (token: string | undefined) => {
  return useQuery({
    queryKey: ['portal-auth', token, Date.now()], // Timestamp força cache bypass total
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

      // Validação de UUID corrompido
      if (data.clientId && !isValidUUID(data.clientId)) {
        console.error('[Portal Auth] ⚠️ UUID CORROMPIDO detectado:', data.clientId);
        throw new Error('UUID do cliente está corrompido. Por favor, recarregue a página.');
      }

      console.log('[Portal Auth] ✅ Token válido para cliente:', data.clientData?.name);
      console.log('[Portal Auth] ✅ UUID validado:', data.clientId);
      console.log('[Portal Auth] 🔍 UUID ANTES DE RETORNAR:', data.clientId);
      console.log('🔄 [Portal Auth] Dados customizados:', data.portalData?.report_config);
      console.log('🔄 [Portal Auth] Cores recebidas:', {
        primary: data.portalData?.report_config?.branding?.primary_color,
        secondary: data.portalData?.report_config?.branding?.secondary_color,
        accent: data.portalData?.report_config?.branding?.accent_color
      });

      const returnData = {
        portalData: data.portalData,
        clientData: data.clientData,
        clientId: data.clientId,
        customization: data.portalData?.report_config || {},
        isValid: true,
      };
      
      console.log('[Portal Auth] 🔍 RETORNANDO clientId:', returnData.clientId);
      return returnData;
    },
    enabled: !!token,
    staleTime: 0, // Força re-fetch imediato - sem cache
    gcTime: 0, // Remove cache completamente (v5)
    refetchOnMount: 'always', // Sempre re-fetch ao montar
    retry: 2,
  });
};

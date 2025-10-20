import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePortalAuth = (token: string | undefined) => {
  return useQuery({
    queryKey: ['portal-auth', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('Token não fornecido');
      }

      console.log('[Portal Auth] Validando token:', token.substring(0, 10) + '...');

      const { data, error } = await supabase
        .from('client_portal_analytics')
        .select(`
          *,
          rank_rent_clients (
            id,
            name,
            company,
            niche,
            email,
            phone
          )
        `)
        .eq('portal_token', token)
        .eq('enabled', true)
        .maybeSingle();

      if (error) {
        console.error('[Portal Auth] Erro ao validar token:', error);
        throw error;
      }

      if (!data) {
        console.warn('[Portal Auth] Token inválido ou portal desativado');
        throw new Error('Portal não encontrado ou desativado');
      }

      console.log('[Portal Auth] Token válido para cliente:', data.rank_rent_clients?.name);

      return {
        portalData: data,
        clientData: data.rank_rent_clients,
        clientId: data.client_id,
        isValid: true,
      };
    },
    enabled: !!token,
    staleTime: 60000, // 1 minuto
    retry: 2,
  });
};

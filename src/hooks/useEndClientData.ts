import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEndClientData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['end-client-data', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      // Buscar perfil do end_client para pegar o parent_user_id e dados do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('parent_user_id, full_name, email')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!userProfile?.parent_user_id) throw new Error('Parent user not found');

      // Buscar o cliente vinculado DIRETAMENTE ao end_client (pela coluna end_client_user_id)
      const { data: client, error: clientError } = await supabase
        .from('rank_rent_clients')
        .select('id, name, email, company')
        .eq('end_client_user_id', userId) // ✅ CORREÇÃO: busca pelo end_client específico
        .eq('user_id', userProfile.parent_user_id) // ✅ Validação adicional
        .single();

      if (clientError) {
        console.error('Client not found for end_client:', clientError);
        return {
          clientId: null,
          ownerUserId: userProfile.parent_user_id,
          clientName: null,
          clientCompany: null,
          clientEmail: null,
          userName: userProfile?.full_name || userProfile?.email || null,
        };
      }

      return {
        clientId: client.id,
        ownerUserId: userProfile.parent_user_id,
        clientName: client.name || client.email || null,
        clientCompany: client.company || null,
        clientEmail: client.email || null,
        userName: userProfile.full_name || userProfile.email || null,
      };
    },
    enabled: !!userId,
  });
};

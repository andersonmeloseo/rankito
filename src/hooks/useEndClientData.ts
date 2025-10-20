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

      // Buscar o cliente associado ao parent_user_id (o dono dos sites)
      const { data: client, error: clientError } = await supabase
        .from('rank_rent_clients')
        .select('id, name, email, company')
        .eq('user_id', userProfile.parent_user_id)
        .single();

      if (clientError) {
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
        clientId: client?.id || null,
        ownerUserId: userProfile.parent_user_id,
        clientName: client?.name || client?.email || null,
        clientCompany: client?.company || null,
        clientEmail: client?.email || null,
        userName: userProfile?.full_name || userProfile?.email || null,
      };
    },
    enabled: !!userId,
  });
};

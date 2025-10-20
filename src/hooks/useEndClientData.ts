import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEndClientData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['end-client-data', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      // Buscar perfil do end_client para pegar o parent_user_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('parent_user_id')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!profile?.parent_user_id) throw new Error('Parent user not found');

      // Buscar o cliente associado ao parent_user_id (o dono dos sites)
      const { data: client, error: clientError } = await supabase
        .from('rank_rent_clients')
        .select('id, name, email, company')
        .eq('user_id', profile.parent_user_id)
        .single();

      if (clientError) {
        // Se não encontrou cliente específico, vamos buscar os sites alugados para este end_client
        // através do owner_user_id que é o parent_user_id
        return {
          clientId: null,
          ownerUserId: profile.parent_user_id,
          clientName: null,
        };
      }

      return {
        clientId: client?.id || null,
        ownerUserId: profile.parent_user_id,
        clientName: client?.name || client?.email || null,
      };
    },
    enabled: !!userId,
  });
};

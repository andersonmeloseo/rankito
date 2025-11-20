import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSuperAdmins = () => {
  return useQuery({
    queryKey: ['super-admins'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');

      if (rolesError) throw rolesError;

      const userIds = roles?.map(r => r.user_id) || [];

      if (userIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });
};

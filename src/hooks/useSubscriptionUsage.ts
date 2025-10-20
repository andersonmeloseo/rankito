import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionUsage {
  sites: number;
  totalPages: number;
  avgPages: number;
}

export const useSubscriptionUsage = (userId?: string) => {
  return useQuery({
    queryKey: ['subscription-usage', userId],
    queryFn: async () => {
      if (!userId) return { sites: 0, totalPages: 0, avgPages: 0 };

      // Buscar sites do usuário
      const { count: sitesCount } = await supabase
        .from('rank_rent_sites')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', userId);

      // Buscar páginas totais
      const { data: sites } = await supabase
        .from('rank_rent_sites')
        .select('id')
        .eq('owner_user_id', userId);

      let totalPages = 0;
      if (sites && sites.length > 0) {
        for (const site of sites) {
          const { count } = await supabase
            .from('rank_rent_pages')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id);
          totalPages += count || 0;
        }
      }

      const avgPages = sites && sites.length > 0 
        ? Math.round(totalPages / sites.length) 
        : 0;

      return {
        sites: sitesCount || 0,
        totalPages,
        avgPages,
      };
    },
    enabled: !!userId,
  });
};

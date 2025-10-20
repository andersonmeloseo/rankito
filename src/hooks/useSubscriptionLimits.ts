import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionLimits {
  subscription: any;
  plan: {
    name: string;
    slug: string;
    max_sites: number | null;
    max_pages_per_site: number | null;
  } | null;
  currentUsage: {
    sitesCount: number;
    pagesPerSite: Record<string, number>;
  };
  canCreateSite: boolean;
  canCreatePage: (siteId: string) => boolean;
  remainingSites: number | null;
  remainingPages: (siteId: string) => number | null;
  isUnlimited: boolean;
  isLoading: boolean;
}

export const useSubscriptionLimits = () => {
  return useQuery({
    queryKey: ['subscription-limits'],
    queryFn: async () => {
      // 1. Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 2. Buscar assinatura ativa + plano
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            slug,
            max_sites,
            max_pages_per_site
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const plan = subscription?.subscription_plans;

      // 3. Buscar uso atual (sites)
      const { count: sitesCount } = await supabase
        .from('rank_rent_sites')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', user.id);

      // 4. Buscar uso atual (páginas por site)
      const { data: sites } = await supabase
        .from('rank_rent_sites')
        .select('id')
        .eq('owner_user_id', user.id);

      const pagesPerSite: Record<string, number> = {};
      if (sites) {
        for (const site of sites) {
          const { count } = await supabase
            .from('rank_rent_pages')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id);
          pagesPerSite[site.id] = count || 0;
        }
      }

      // 5. Calcular permissões
      const isUnlimited = plan?.max_sites === null;
      const canCreateSite = isUnlimited || (sitesCount || 0) < (plan?.max_sites || 0);

      const canCreatePage = (siteId: string) => {
        if (plan?.max_pages_per_site === null) return true;
        return (pagesPerSite[siteId] || 0) < (plan?.max_pages_per_site || 0);
      };

      const remainingSites = isUnlimited 
        ? null 
        : (plan?.max_sites || 0) - (sitesCount || 0);

      const remainingPages = (siteId: string) => {
        if (plan?.max_pages_per_site === null) return null;
        return (plan?.max_pages_per_site || 0) - (pagesPerSite[siteId] || 0);
      };

      return {
        subscription,
        plan,
        currentUsage: {
          sitesCount: sitesCount || 0,
          pagesPerSite,
        },
        canCreateSite,
        canCreatePage,
        remainingSites,
        remainingPages,
        isUnlimited,
        isLoading: false,
      } as SubscriptionLimits;
    },
  });
};

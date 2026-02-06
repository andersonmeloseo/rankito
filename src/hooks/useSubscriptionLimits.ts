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

interface SubscriptionLimitsRPCResponse {
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    name: string;
    slug: string;
    max_sites: number | null;
    max_pages_per_site: number | null;
  } | null;
  sites_count: number;
  pages_per_site: Record<string, number> | null;
}

export const useSubscriptionLimits = () => {
  return useQuery({
    queryKey: ['subscription-limits'],
    queryFn: async () => {
      // 1. Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 2. Usar RPC otimizada que retorna tudo em uma única query
      const { data, error } = await supabase.rpc('get_subscription_limits_data', {
        p_user_id: user.id
      });

      if (error) throw error;

      const rpcData = data as unknown as SubscriptionLimitsRPCResponse;

      // Extrair dados da resposta
      const subscription = rpcData?.subscription;
      const plan = subscription ? {
        name: subscription.name,
        slug: subscription.slug,
        max_sites: subscription.max_sites,
        max_pages_per_site: subscription.max_pages_per_site,
      } : null;

      const sitesCount = rpcData?.sites_count || 0;
      const pagesPerSite = rpcData?.pages_per_site || {};

      // 3. Calcular permissões
      const isUnlimited = plan?.max_sites === null;
      const canCreateSite = isUnlimited || sitesCount < (plan?.max_sites || 0);

      const canCreatePage = (siteId: string) => {
        if (plan?.max_pages_per_site === null) return true;
        return (pagesPerSite[siteId] || 0) < (plan?.max_pages_per_site || 0);
      };

      const remainingSites = isUnlimited 
        ? null 
        : (plan?.max_sites || 0) - sitesCount;

      const remainingPages = (siteId: string) => {
        if (plan?.max_pages_per_site === null) return null;
        return (plan?.max_pages_per_site || 0) - (pagesPerSite[siteId] || 0);
      };

      return {
        subscription,
        plan,
        currentUsage: {
          sitesCount,
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
    staleTime: 600000, // 10 minutos de cache (plano raramente muda)
    gcTime: 900000, // 15 minutos em memória
  });
};

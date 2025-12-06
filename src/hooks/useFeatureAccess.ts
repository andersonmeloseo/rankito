import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureAccess {
  hasAdvancedTracking: boolean;
  isLoading: boolean;
  planName: string | null;
}

export const useFeatureAccess = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-access'],
    queryFn: async (): Promise<FeatureAccess> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { hasAdvancedTracking: false, isLoading: false, planName: null };
      }

      // Buscar assinatura ativa com plano
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            has_advanced_tracking
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const plan = subscription?.subscription_plans as any;

      return {
        hasAdvancedTracking: plan?.has_advanced_tracking ?? false,
        isLoading: false,
        planName: plan?.name ?? null,
      };
    },
  });

  return {
    hasAdvancedTracking: data?.hasAdvancedTracking ?? false,
    isLoading,
    planName: data?.planName ?? null,
  };
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTrialStatus = () => {
  return useQuery({
    queryKey: ['trial-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isExpired: false, trialEndDate: null };

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          status,
          trial_end_date,
          current_period_end,
          subscription_plans(name, trial_days)
        `)
        .eq('user_id', user.id)
        .eq('status', 'trial')
        .maybeSingle();

      if (error || !subscription) {
        return { isExpired: false, trialEndDate: null };
      }

      const today = new Date();
      const trialEnd = new Date(subscription.trial_end_date);
      const isExpired = today > trialEnd;

      return {
        isExpired,
        trialEndDate: subscription.trial_end_date,
        daysRemaining: Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        planName: subscription.subscription_plans?.name,
      };
    },
    refetchInterval: 60000, // Verificar a cada 1 minuto
  });
};

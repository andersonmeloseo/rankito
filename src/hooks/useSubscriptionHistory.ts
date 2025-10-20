import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionHistoryEntry {
  id: string;
  subscription_id: string;
  action: string;
  old_values: any;
  new_values: any;
  changed_by: string | null;
  created_at: string;
  notes: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

export const useSubscriptionHistory = (subscriptionId?: string) => {
  return useQuery({
    queryKey: ['subscription-history', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];

      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = data?.map(h => h.changed_by).filter(Boolean) || [];
      if (userIds.length === 0) return data as SubscriptionHistoryEntry[];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Merge profiles data
      const enriched = data?.map(entry => ({
        ...entry,
        profiles: profilesData?.find(p => p.id === entry.changed_by) || null,
      }));

      return enriched as SubscriptionHistoryEntry[];
    },
    enabled: !!subscriptionId,
  });
};

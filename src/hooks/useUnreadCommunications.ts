import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadCommunications(userId?: string) {
  return useQuery({
    queryKey: ["unread-communications", userId],
    queryFn: async () => {
      if (!userId) return { count: 0, tickets: [] };

      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, unread_user_count, last_message_at, subject")
        .eq("user_id", userId)
        .gt("unread_user_count", 0)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      return {
        count: data?.reduce((sum, t) => sum + t.unread_user_count, 0) || 0,
        tickets: data || []
      };
    },
    enabled: !!userId,
    refetchInterval: 30000 // Atualiza a cada 30s
  });
}

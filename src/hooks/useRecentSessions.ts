import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Session {
  id: string;
  session_id: string;
  entry_page_url: string;
  exit_page_url: string | null;
  entry_time: string;
  pages_visited: number;
  total_duration_seconds: number | null;
  device: string | null;
  city: string | null;
  country: string | null;
}

export const useRecentSessions = (siteId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['recent-sessions', siteId, limit],
    queryFn: async (): Promise<Session[]> => {
      const { data, error } = await supabase
        .from('rank_rent_sessions')
        .select('*')
        .eq('site_id', siteId)
        .order('entry_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId,
    refetchInterval: 30000
  });
};

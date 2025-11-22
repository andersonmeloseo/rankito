import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PageVisit {
  id: string;
  page_url: string;
  page_title: string | null;
  sequence_number: number;
  entry_time: string;
  exit_time: string | null;
  time_spent_seconds: number | null;
}

interface SessionDetails {
  id: string;
  session_id: string;
  entry_page_url: string;
  exit_page_url: string | null;
  entry_time: string;
  exit_time: string | null;
  total_duration_seconds: number | null;
  pages_visited: number;
  device: string | null;
  referrer: string | null;
  city: string | null;
  country: string | null;
  visits: PageVisit[];
}

export const useSessionDetails = (sessionId: string) => {
  return useQuery({
    queryKey: ['session-details', sessionId],
    queryFn: async (): Promise<SessionDetails | null> => {
      // Fetch session
      const { data: session, error: sessionError } = await supabase
        .from('rank_rent_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      if (!session) return null;

      // Fetch page visits
      const { data: visits, error: visitsError } = await supabase
        .from('rank_rent_page_visits')
        .select('*')
        .eq('session_id', sessionId)
        .order('sequence_number');

      if (visitsError) throw visitsError;

      return {
        ...session,
        visits: visits || []
      };
    },
    enabled: !!sessionId
  });
};

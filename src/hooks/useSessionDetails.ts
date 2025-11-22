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

interface ClickEvent {
  id: string;
  event_type: string;
  page_url: string;
  created_at: string;
  cta_text: string | null;
  metadata: any;
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
  clicks: ClickEvent[];
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

      // Fetch clicks for this session
      const { data: clicks, error: clicksError } = await supabase
        .from('rank_rent_conversions')
        .select('id, event_type, page_url, created_at, cta_text, metadata')
        .eq('session_id', sessionId)
        .in('event_type', ['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit'])
        .order('created_at');

      if (clicksError) throw clicksError;

      return {
        ...session,
        visits: visits || [],
        clicks: clicks || []
      };
    },
    enabled: !!sessionId
  });
};

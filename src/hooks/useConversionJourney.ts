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
  goal_name: string | null;
}

interface SessionData {
  id: string;
  session_id: string;
  entry_page_url: string;
  exit_page_url: string | null;
  entry_time: string;
  exit_time: string | null;
  total_duration_seconds: number | null;
  pages_visited: number;
  device: string | null;
  city: string | null;
  country: string | null;
}

export interface ConversionJourneyData {
  session: SessionData | null;
  visits: PageVisit[];
  clicks: ClickEvent[];
}

export const useConversionJourney = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['conversion-journey', sessionId],
    queryFn: async (): Promise<ConversionJourneyData> => {
      if (!sessionId) {
        return { session: null, visits: [], clicks: [] };
      }

      // Buscar sessão pelo session_id (string)
      const { data: session, error: sessionError } = await supabase
        .from('rank_rent_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return { session: null, visits: [], clicks: [] };
      }

      if (!session) {
        return { session: null, visits: [], clicks: [] };
      }

      // Buscar page visits usando o ID da sessão (UUID)
      const { data: visits, error: visitsError } = await supabase
        .from('rank_rent_page_visits')
        .select('id, page_url, page_title, sequence_number, entry_time, exit_time, time_spent_seconds')
        .eq('session_id', session.id)
        .order('sequence_number');

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
      }

      // Buscar cliques/ações da sessão
      const { data: clicks, error: clicksError } = await supabase
        .from('rank_rent_conversions')
        .select('id, event_type, page_url, created_at, cta_text, goal_name')
        .eq('session_id', sessionId)
        .in('event_type', ['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit'])
        .order('created_at');

      if (clicksError) {
        console.error('Error fetching clicks:', clicksError);
      }

      return {
        session,
        visits: visits || [],
        clicks: clicks || []
      };
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000
  });
};

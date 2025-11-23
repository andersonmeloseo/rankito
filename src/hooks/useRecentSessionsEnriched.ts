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

export interface EnrichedSession {
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
  percentOfTotal: number;
}

export const useRecentSessionsEnriched = (siteId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['recent-sessions-enriched', siteId, limit],
    queryFn: async (): Promise<EnrichedSession[]> => {
      // Buscar sessões
      const { data: sessions, error: sessionsError } = await supabase
        .from('rank_rent_sessions')
        .select('*')
        .eq('site_id', siteId)
        .order('entry_time', { ascending: false })
        .limit(limit);

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);

      // Buscar todas as visitas de página
      const { data: allVisits, error: visitsError } = await supabase
        .from('rank_rent_page_visits')
        .select('*')
        .in('session_id', sessionIds)
        .order('sequence_number');

      if (visitsError) throw visitsError;

      // Buscar todos os cliques
      const { data: allClicks, error: clicksError } = await supabase
        .from('rank_rent_conversions')
        .select('id, event_type, page_url, created_at, cta_text, metadata, session_id')
        .in('session_id', sessionIds)
        .in('event_type', ['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit'])
        .order('created_at');

      if (clicksError) throw clicksError;

      // Agrupar visitas e cliques por sessão
      const visitsMap = new Map<string, PageVisit[]>();
      const clicksMap = new Map<string, ClickEvent[]>();

      allVisits?.forEach(visit => {
        const existing = visitsMap.get(visit.session_id) || [];
        visitsMap.set(visit.session_id, [...existing, visit]);
      });

      allClicks?.forEach(click => {
        const existing = clicksMap.get(click.session_id) || [];
        clicksMap.set(click.session_id, [...existing, click]);
      });

      // Calcular duração total por sessão
      const durationMap = new Map<string, number>();
      allVisits?.forEach(visit => {
        const current = durationMap.get(visit.session_id) || 0;
        durationMap.set(visit.session_id, current + (visit.time_spent_seconds || 0));
      });

      // Total de sessões para calcular %
      const totalSessions = sessions.length;

      // Enriquecer cada sessão
      return sessions.map(session => ({
        ...session,
        total_duration_seconds: durationMap.get(session.id) || 0,
        visits: visitsMap.get(session.id) || [],
        clicks: clicksMap.get(session.id) || [],
        percentOfTotal: totalSessions > 0 ? (1 / totalSessions) * 100 : 0,
      }));
    },
    enabled: !!siteId,
    refetchInterval: 30000,
  });
};

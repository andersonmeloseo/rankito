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
  bot_name: string | null;
}

export const useRecentSessions = (siteId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['recent-sessions', siteId, limit],
    queryFn: async (): Promise<Session[]> => {
      // Buscar sessões
      const { data: sessions, error: sessionsError } = await supabase
        .from('rank_rent_sessions')
        .select('*')
        .eq('site_id', siteId)
        .order('entry_time', { ascending: false })
        .limit(limit);

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];

      // Buscar page visits para calcular duração real
      const sessionIds = sessions.map(s => s.id);
      const { data: visits } = await supabase
        .from('rank_rent_page_visits')
        .select('session_id, time_spent_seconds')
        .in('session_id', sessionIds);

      // Calcular duração total por sessão (soma de time_spent_seconds de todas as páginas)
      const durationMap = new Map<string, number>();
      if (visits) {
        visits.forEach(visit => {
          const current = durationMap.get(visit.session_id) || 0;
          durationMap.set(visit.session_id, current + (visit.time_spent_seconds || 0));
        });
      }

      // Retornar sessões com duração calculada
      return sessions.map(session => ({
        ...session,
        total_duration_seconds: durationMap.get(session.id) || 0
      }));
    },
    enabled: !!siteId,
    staleTime: 60000,
    refetchInterval: 120000 // 2 minutos ao invés de 15s
  });
};

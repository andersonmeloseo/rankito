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
  bot_name: string | null;
  visits: PageVisit[];
  clicks: ClickEvent[];
  percentOfTotal: number;
}

export interface PaginationResult {
  sessions: EnrichedSession[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const useRecentSessionsEnriched = (
  siteId: string,
  options?: {
    page?: number;
    pageSize?: number;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 25;
  const startDate = options?.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 dias padrão
  const endDate = options?.endDate || new Date();

  return useQuery({
    queryKey: ['recent-sessions-enriched', siteId, page, pageSize, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<PaginationResult> => {
      // Primeiro, contar total de sessões
      const { count, error: countError } = await supabase
        .from('rank_rent_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('entry_time', startDate.toISOString())
        .lte('entry_time', endDate.toISOString());

      if (countError) throw countError;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Buscar sessões paginadas
      const offset = (page - 1) * pageSize;
      const { data: sessions, error: sessionsError } = await supabase
        .from('rank_rent_sessions')
        .select('*')
        .eq('site_id', siteId)
        .gte('entry_time', startDate.toISOString())
        .lte('entry_time', endDate.toISOString())
        .order('entry_time', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (sessionsError) throw sessionsError;
      
      if (!sessions || sessions.length === 0) {
        return {
          sessions: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      // Usar session_id (string token) ao invés de id (UUID)
      const sessionTokens = sessions.map(s => s.session_id);

      // Buscar TODOS os eventos de rank_rent_conversions
      const { data: allEvents, error: eventsError } = await supabase
        .from('rank_rent_conversions')
        .select('*')
        .in('session_id', sessionTokens)
        .order('sequence_number');

      if (eventsError) throw eventsError;

      // Processar eventos por sessão
      const visitsMap = new Map<string, PageVisit[]>();
      const clicksMap = new Map<string, ClickEvent[]>();
      const durationMap = new Map<string, number>();

      sessions.forEach(session => {
        const sessionEvents = allEvents?.filter(e => e.session_id === session.session_id) || [];
        
        // Extrair page_views e calcular tempo gasto
        const pageViews = sessionEvents.filter(e => e.event_type === 'page_view');
        const visits: PageVisit[] = pageViews.map((pageView, index) => {
          // Encontrar page_exit correspondente
          const pageExit = sessionEvents.find(e => 
            e.event_type === 'page_exit' && 
            e.page_url === pageView.page_url &&
            e.sequence_number > pageView.sequence_number
          );
          
          // Calcular tempo gasto
          let timeSpent = 0;
          if (pageExit) {
            timeSpent = Math.floor((new Date(pageExit.created_at).getTime() - new Date(pageView.created_at).getTime()) / 1000);
          }
          
          return {
            id: pageView.id,
            page_url: pageView.page_url,
            page_title: (pageView.metadata as any)?.page_title || null,
            sequence_number: pageView.sequence_number || index + 1,
            entry_time: pageView.created_at,
            exit_time: pageExit?.created_at || null,
            time_spent_seconds: timeSpent > 0 ? timeSpent : null,
          };
        });
        
        visitsMap.set(session.session_id, visits);
        
        // Extrair cliques
        const clicks: ClickEvent[] = sessionEvents
          .filter(e => ['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit'].includes(e.event_type))
          .map(click => ({
            id: click.id,
            event_type: click.event_type,
            page_url: click.page_url,
            created_at: click.created_at,
            cta_text: click.cta_text,
            metadata: click.metadata,
          }));
        
        clicksMap.set(session.session_id, clicks);
        
        // Calcular duração total
        const totalDuration = visits.reduce((sum, v) => sum + (v.time_spent_seconds || 0), 0);
        durationMap.set(session.session_id, totalDuration);
      });

      // Total de sessões para calcular %
      const totalSessions = sessions.length;

      // Enriquecer cada sessão
      const enrichedSessions = sessions.map(session => ({
        ...session,
        total_duration_seconds: durationMap.get(session.session_id) || 0,
        visits: visitsMap.get(session.session_id) || [],
        clicks: clicksMap.get(session.session_id) || [],
        percentOfTotal: totalSessions > 0 ? (1 / totalSessions) * 100 : 0,
      }));

      return {
        sessions: enrichedSessions,
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    enabled: !!siteId,
    staleTime: 30000,
    refetchInterval: 15000,
  });
};

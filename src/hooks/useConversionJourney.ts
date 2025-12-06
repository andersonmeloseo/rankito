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
  isConversionPage?: boolean;
}

interface ClickEvent {
  id: string;
  event_type: string;
  page_url: string;
  created_at: string;
  cta_text: string | null;
  goal_name: string | null;
}

export interface ConversionJourneyData {
  session: {
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
    referrer: string | null;
  } | null;
  visits: PageVisit[];
  clicks: ClickEvent[];
  isPartial: boolean;
  conversionPageUrl: string | null;
  maxScrollDepth: number | null;
}

export const useConversionJourney = (sessionId: string | null, conversionId?: string) => {
  return useQuery({
    queryKey: ['conversion-journey', sessionId, conversionId],
    queryFn: async (): Promise<ConversionJourneyData> => {
      if (!sessionId) {
        return { session: null, visits: [], clicks: [], isPartial: false, conversionPageUrl: null, maxScrollDepth: null };
      }

      // Buscar TODOS os eventos da sessão de rank_rent_conversions
      const { data: allEvents, error: eventsError } = await supabase
        .from('rank_rent_conversions')
        .select('id, page_url, page_path, event_type, created_at, sequence_number, time_spent_seconds, cta_text, goal_name, city, country, metadata, referrer')
        .eq('session_id', sessionId)
        .order('sequence_number', { ascending: true });

      if (eventsError) {
        console.error('Error fetching session events:', eventsError);
        return { session: null, visits: [], clicks: [], isPartial: false, conversionPageUrl: null, maxScrollDepth: null };
      }

      if (!allEvents || allEvents.length === 0) {
        return { session: null, visits: [], clicks: [], isPartial: false, conversionPageUrl: null, maxScrollDepth: null };
      }

      // Se temos conversionId, encontrar o evento de conversão e filtrar eventos até ele
      let conversionEvent = null;
      let eventsToProcess = allEvents;
      
      if (conversionId) {
        conversionEvent = allEvents.find(e => e.id === conversionId);
        if (conversionEvent) {
          // Filtrar apenas eventos que ocorreram ANTES ou no momento da conversão
          const conversionTime = new Date(conversionEvent.created_at).getTime();
          eventsToProcess = allEvents.filter(e => 
            new Date(e.created_at).getTime() <= conversionTime
          );
        }
      }

      // Separar eventos por tipo
      const pageViewEvents = eventsToProcess.filter(e => e.event_type === 'page_view');
      const pageExitEvents = eventsToProcess.filter(e => e.event_type === 'page_exit');
      const scrollEvents = eventsToProcess.filter(e => e.event_type === 'scroll_depth');
      const clickEvents = eventsToProcess.filter(e => 
        ['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit'].includes(e.event_type)
      );

      // Calcular scroll máximo da sessão
      let maxScrollDepth: number | null = null;
      for (const scrollEvent of scrollEvents) {
        const scrollValue = (scrollEvent.metadata as any)?.scroll_depth;
        if (typeof scrollValue === 'number' && (maxScrollDepth === null || scrollValue > maxScrollDepth)) {
          maxScrollDepth = scrollValue;
        }
      }

      // Construir lista de visits a partir dos page_view events
      const visits: PageVisit[] = pageViewEvents.map((pv, index) => {
        // Encontrar o page_exit correspondente
        const exitEvent = pageExitEvents.find(pe => 
          pe.page_url === pv.page_url && 
          (pe.sequence_number || 0) > (pv.sequence_number || 0)
        );

        // Calcular tempo na página
        let timeSpent = pv.time_spent_seconds;
        if (!timeSpent && exitEvent) {
          const entryTime = new Date(pv.created_at).getTime();
          const exitTime = new Date(exitEvent.created_at).getTime();
          timeSpent = Math.round((exitTime - entryTime) / 1000);
        }
        // Fallback: calcular baseado no próximo page_view
        if (!timeSpent && pageViewEvents[index + 1]) {
          const entryTime = new Date(pv.created_at).getTime();
          const nextEntryTime = new Date(pageViewEvents[index + 1].created_at).getTime();
          timeSpent = Math.round((nextEntryTime - entryTime) / 1000);
        }

        // Marcar se esta é a página de conversão
        const isConversionPage = conversionEvent ? pv.page_url === conversionEvent.page_url : false;

        return {
          id: pv.id,
          page_url: pv.page_url,
          page_title: null,
          sequence_number: pv.sequence_number || index + 1,
          entry_time: pv.created_at,
          exit_time: exitEvent?.created_at || null,
          time_spent_seconds: timeSpent,
          isConversionPage
        };
      });

      // Construir clicks para exibição
      const clicks: ClickEvent[] = clickEvents.map(ce => ({
        id: ce.id,
        event_type: ce.event_type,
        page_url: ce.page_url,
        created_at: ce.created_at,
        cta_text: ce.cta_text,
        goal_name: ce.goal_name
      }));

      // Construir dados da sessão
      const firstEvent = eventsToProcess[0];
      const lastEvent = eventsToProcess[eventsToProcess.length - 1];
      const firstPageView = pageViewEvents[0];

      let totalDuration: number | null = null;
      if (firstEvent && lastEvent) {
        const start = new Date(firstEvent.created_at).getTime();
        const end = new Date(lastEvent.created_at).getTime();
        totalDuration = Math.round((end - start) / 1000);
      }

      // Extrair device do metadata
      const deviceFromMetadata = (firstEvent.metadata as any)?.device || null;

      const session = {
        session_id: sessionId,
        entry_page_url: firstPageView?.page_url || firstEvent.page_url,
        exit_page_url: conversionEvent?.page_url || lastEvent.page_url,
        entry_time: firstEvent.created_at,
        exit_time: lastEvent.created_at,
        total_duration_seconds: totalDuration,
        pages_visited: pageViewEvents.length,
        device: deviceFromMetadata,
        city: firstEvent.city,
        country: firstEvent.country,
        referrer: firstEvent.referrer || (firstEvent.metadata as any)?.referrer || null
      };

      // Verificar se é jornada parcial
      const isPartial = pageViewEvents.length <= 1;

      return {
        session,
        visits,
        clicks,
        isPartial,
        conversionPageUrl: conversionEvent?.page_url || null,
        maxScrollDepth
      };
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000
  });
};

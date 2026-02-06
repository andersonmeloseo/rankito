import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import type { CommonSequence, LocationData, ClickEventSummary } from "./useSessionAnalytics";

// Tipos para queries de sequências
interface SessionRow {
  id: string;
  session_id: string;
  entry_page_url: string;
  exit_page_url: string | null;
  entry_time: string;
  pages_visited: number;
  total_duration_seconds: number | null;
  city: string | null;
  country: string | null;
}

interface VisitRow {
  session_id: string;
  page_url: string;
  sequence_number: number;
  time_spent_seconds: number | null;
  created_at: string;
}

interface ClickRow {
  session_id: string;
  event_type: string;
  page_url: string;
  metadata: unknown;
  cta_text: string | null;
}

interface SessionSequencesResult {
  commonSequences: CommonSequence[];
  stepVolumes: Map<string, number>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook dedicado para carregar sequências de sessão sob demanda (lazy loading)
 * Separado do useSessionAnalytics para evitar carregamento pesado na Visão Geral
 */
export const useSessionSequences = (siteId: string, days: number = 30, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['session-sequences', siteId, days],
    queryFn: async (): Promise<{ commonSequences: CommonSequence[]; stepVolumes: Map<string, number> }> => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Buscar dados para sequências (limitado para performance)
      const [sessionsResult, visitsResult, clicksResult] = await Promise.all([
        supabase
          .from('rank_rent_sessions')
          .select('id, session_id, entry_page_url, exit_page_url, entry_time, pages_visited, total_duration_seconds, city, country')
          .eq('site_id', siteId)
          .gte('entry_time', startDate.toISOString())
          .lte('entry_time', endDate.toISOString())
          .order('entry_time', { ascending: false })
          .limit(300), // Reduzido para performance

        supabase
          .from('rank_rent_page_visits')
          .select('session_id, page_url, sequence_number, time_spent_seconds, created_at')
          .eq('site_id', siteId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('session_id')
          .order('sequence_number')
          .limit(1500), // Reduzido para performance

        supabase
          .from('rank_rent_conversions')
          .select('session_id, event_type, page_url, metadata, cta_text')
          .eq('site_id', siteId)
          .in('event_type', ['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit'])
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .limit(500) // Reduzido para performance
      ]);

      const sessions = (sessionsResult.data || []) as SessionRow[];
      const visits = (visitsResult.data || []) as VisitRow[];
      const clicks = (clicksResult.data || []) as ClickRow[];

      if (sessions.length === 0) {
        return { commonSequences: [], stepVolumes: new Map() };
      }

      // Criar mapeamento UUID ↔ session_id para compatibilidade
      const uuidToSessionId = new Map<string, string>();
      sessions.forEach(s => {
        uuidToSessionId.set(s.id, s.session_id);
      });

      // Build sequences with enriched data
      const sequencesMap = new Map<string, {
        count: number;
        sessionIds: string[];
        sessionIdsWithClicks: Set<string>;
        totalDuration: number;
        clickEvents: Map<string, ClickEventSummary>;
        timePerUrl: Map<string, { totalTime: number; count: number }>;
        firstAccessTime: string;
      }>();

      if (visits.length > 0) {
        // Calculate time fallback when time_spent_seconds is null
        const enrichedVisits = visits.map((visit, index) => {
          let timeSpent = visit.time_spent_seconds;

          if (!timeSpent && index < visits.length - 1) {
            const nextVisit = visits[index + 1];
            if (visit.session_id === nextVisit.session_id) {
              const timeDiff = new Date(nextVisit.created_at).getTime() -
                new Date(visit.created_at).getTime();
              timeSpent = Math.floor(timeDiff / 1000);
            }
          }

          return { ...visit, time_spent_seconds: timeSpent || 0 };
        });

        const sessionSequences = new Map<string, { urls: string[]; duration: number }>();
        enrichedVisits.forEach(v => {
          if (!sessionSequences.has(v.session_id)) {
            sessionSequences.set(v.session_id, { urls: [], duration: 0 });
          }
          const session = sessionSequences.get(v.session_id)!;
          session.urls.push(v.page_url);
          session.duration += v.time_spent_seconds || 0;
        });

        sessionSequences.forEach((data, sessionUuid) => {
          if (data.urls.length >= 1) {
            const key = data.urls.join(' → ');
            const session = sessions.find(s => s.id === sessionUuid);
            const sessionIdText = uuidToSessionId.get(sessionUuid);

            if (!sessionIdText) return;

            const existing = sequencesMap.get(key) || {
              count: 0,
              sessionIds: [],
              sessionIdsWithClicks: new Set<string>(),
              totalDuration: 0,
              clickEvents: new Map(),
              timePerUrl: new Map(),
              firstAccessTime: session?.entry_time || new Date().toISOString()
            };

            if (session?.entry_time && new Date(session.entry_time) < new Date(existing.firstAccessTime)) {
              existing.firstAccessTime = session.entry_time;
            }

            existing.count++;
            existing.sessionIds.push(sessionIdText);
            existing.totalDuration += data.duration;
            sequencesMap.set(key, existing);
          }
        });

        // Aggregate time spent per specific URL
        enrichedVisits.forEach(v => {
          const sessionData = sessionSequences.get(v.session_id);
          if (sessionData && sessionData.urls.length >= 1) {
            const key = sessionData.urls.join(' → ');
            const seqData = sequencesMap.get(key);
            if (seqData) {
              const urlTime = seqData.timePerUrl.get(v.page_url) || { totalTime: 0, count: 0 };
              urlTime.totalTime += v.time_spent_seconds || 0;
              urlTime.count++;
              seqData.timePerUrl.set(v.page_url, urlTime);
            }
          }
        });
      }

      // Add click events to sequences
      if (clicks.length > 0) {
        clicks.forEach(click => {
          if (!click.session_id) return;

          sequencesMap.forEach((data) => {
            if (data.sessionIds.includes(click.session_id)) {
              if (!data.sessionIdsWithClicks) {
                data.sessionIdsWithClicks = new Set();
              }
              data.sessionIdsWithClicks.add(click.session_id);

              const clickKey = `${click.page_url}-${click.event_type}`;
              const existing = data.clickEvents.get(clickKey) || {
                pageUrl: click.page_url,
                eventType: click.event_type,
                count: 0,
                ctaText: (() => {
                  const rootCta = click.cta_text?.trim();
                  const metaCta = (click.metadata as { cta_text?: string })?.cta_text?.trim();
                  return rootCta || metaCta || undefined;
                })()
              };
              existing.count++;
              data.clickEvents.set(clickKey, existing);
            }
          });
        });
      }

      // Calculate locations for each sequence
      const totalSessions = sessions.length;
      const commonSequences = Array.from(sequencesMap.entries())
        .map(([sequenceStr, data]) => {
          const locations = new Map<string, LocationData>();

          data.sessionIds.forEach(sessionIdText => {
            const session = sessions.find(s => s.session_id === sessionIdText);
            if (session?.city && session?.country) {
              const key = `${session.city}-${session.country}`;
              const existing = locations.get(key) || {
                city: session.city,
                country: session.country,
                count: 0
              };
              existing.count++;
              locations.set(key, existing);
            }
          });

          return {
            sequence: sequenceStr.split(' → '),
            count: data.count,
            percentage: (data.count / totalSessions) * 100,
            pageCount: sequenceStr.split(' → ').length,
            locations: Array.from(locations.values()).sort((a, b) => b.count - a.count),
            avgDuration: data.totalDuration / data.count,
            avgTimePerPage: data.totalDuration / data.count / sequenceStr.split(' → ').length,
            clickEvents: Array.from(data.clickEvents.values()),
            sessionsWithClicks: data.sessionIdsWithClicks?.size || 0,
            timePerUrl: Object.fromEntries(
              Array.from(data.timePerUrl.entries()).map(([url, { totalTime, count }]) => [
                url,
                Math.round(totalTime / count)
              ])
            ),
            firstAccessTime: data.firstAccessTime
          };
        })
        .sort((a, b) => b.count - a.count);

      // Calculate step volumes for the most common sequence
      const stepVolumes = new Map<string, number>();
      if (commonSequences.length > 0 && visits.length > 0) {
        const mostCommonSequence = commonSequences[0].sequence;

        const sessionVisitsMap = new Map<string, string[]>();
        visits.forEach(visit => {
          if (!sessionVisitsMap.has(visit.session_id)) {
            sessionVisitsMap.set(visit.session_id, []);
          }
          sessionVisitsMap.get(visit.session_id)!.push(visit.page_url);
        });

        mostCommonSequence.forEach((targetUrl, stepIndex) => {
          const sessionsThatReachedStep = new Set<string>();

          sessionVisitsMap.forEach((urls, sessionUuid) => {
            const sessionIdText = uuidToSessionId.get(sessionUuid);
            if (!sessionIdText) return;

            let matches = true;
            for (let i = 0; i <= stepIndex; i++) {
              if (i >= urls.length || urls[i] !== mostCommonSequence[i]) {
                matches = false;
                break;
              }
            }
            if (matches) {
              sessionsThatReachedStep.add(sessionIdText);
            }
          });

          stepVolumes.set(targetUrl, sessionsThatReachedStep.size);
        });
      }

      return { commonSequences, stepVolumes };
    },
    enabled: !!siteId && enabled, // Só carrega quando habilitado (lazy)
    staleTime: 120000, // 2 minutos de cache (dados menos voláteis)
    refetchInterval: false // Não refetch automático para sequências
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export interface SessionMetrics {
  totalSessions: number;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  avgDuration: number;
  avgPagesPerSession: number;
  engagementRate: number;
  bounceRate: number;
}

export interface TopPage {
  page_url: string;
  entries: number;
  exits: number;
}

export interface LocationData {
  city: string;
  country: string;
  count: number;
}

export interface ClickEventSummary {
  pageUrl: string;
  eventType: string;
  count: number;
  ctaText?: string;
}

export interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
  pageCount: number;
  locations: LocationData[];
  avgDuration: number;
  avgTimePerPage: number;
  clickEvents: ClickEventSummary[];
  sessionsWithClicks: number;
  timePerUrl: Record<string, number>;
  firstAccessTime: string;
}

interface SessionAnalytics {
  metrics: SessionMetrics;
  topEntryPages: TopPage[];
  topExitPages: TopPage[];
  commonSequences: CommonSequence[];
  stepVolumes: Map<string, number>;
}

export const useSessionAnalytics = (siteId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['session-analytics', siteId, days],
    queryFn: async (): Promise<SessionAnalytics> => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // OTIMIZAÇÃO: Query única consolidada com Promise.all para máxima performance
      const [sessionsResponse, visitsResponse, clicksResponse] = await Promise.all([
        supabase
          .from('rank_rent_sessions')
          .select('id, session_id, entry_page_url, exit_page_url, entry_time, pages_visited, total_duration_seconds, device, city, country, referrer')
          .eq('site_id', siteId)
          .gte('entry_time', startDate.toISOString())
          .lte('entry_time', endDate.toISOString())
          .order('entry_time', { ascending: false })
          .range(0, 9999999),
        
        supabase
          .from('rank_rent_page_visits')
          .select('session_id, page_url, sequence_number, time_spent_seconds, created_at')
          .eq('site_id', siteId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('session_id')
          .order('sequence_number')
          .range(0, 9999999),
        
        supabase
          .from('rank_rent_conversions')
          .select('session_id, event_type, page_url, metadata, cta_text, created_at')
          .eq('site_id', siteId)
          .in('event_type', ['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit'])
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .range(0, 9999999)
      ]);

      if (sessionsResponse.error) throw sessionsResponse.error;
      
      const sessions = sessionsResponse.data;
      const visits = visitsResponse.data;
      const clicks = clicksResponse.data;

      // Criar mapeamento UUID ↔ session_id (TEXT) para compatibilidade
      const uuidToSessionId = new Map<string, string>();
      sessions.forEach(s => {
        uuidToSessionId.set(s.id, s.session_id);
      });

      if (!sessions || sessions.length === 0) return {
        metrics: { 
          totalSessions: 0, 
          uniqueVisitors: 0,
          newVisitors: 0,
          returningVisitors: 0,
          avgDuration: 0, 
          avgPagesPerSession: 0, 
          engagementRate: 0,
          bounceRate: 0 
        },
        topEntryPages: [],
        topExitPages: [],
        commonSequences: [],
        stepVolumes: new Map()
      };

      // Calculate metrics
      const totalSessions = sessions.length;
      const bounceSessions = sessions.filter(s => s.pages_visited === 1).length;
      const avgDuration = sessions.reduce((acc, s) => acc + (s.total_duration_seconds || 0), 0) / totalSessions || 0;
      const avgPagesPerSession = sessions.reduce((acc, s) => acc + (s.pages_visited || 0), 0) / totalSessions || 0;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
      
      // New metrics: Unique visitors (by IP or session_id)
      const uniqueSessionIds = new Set(sessions.map(s => s.session_id));
      const uniqueVisitors = uniqueSessionIds.size;
      
      // Simulate new vs returning (in real app, would check historical data)
      // For now, approximate: if session_id appears multiple times in period, it's returning
      const sessionIdCounts = new Map<string, number>();
      sessions.forEach(s => {
        sessionIdCounts.set(s.session_id, (sessionIdCounts.get(s.session_id) || 0) + 1);
      });
      const returningCount = Array.from(sessionIdCounts.values()).filter(count => count > 1).length;
      const newCount = uniqueVisitors - returningCount;
      
      const newVisitors = newCount;
      const returningVisitors = returningCount;
      const engagementRate = 100 - bounceRate;

      // Top entry pages
      const entryPagesMap = new Map<string, number>();
      sessions.forEach(s => {
        const count = entryPagesMap.get(s.entry_page_url) || 0;
        entryPagesMap.set(s.entry_page_url, count + 1);
      });
      const topEntryPages = Array.from(entryPagesMap.entries())
        .map(([page_url, entries]) => ({ page_url, entries, exits: 0 }))
        .sort((a, b) => b.entries - a.entries)
        .slice(0, 10);

      // Top exit pages
      const exitPagesMap = new Map<string, number>();
      sessions.forEach(s => {
        if (s.exit_page_url) {
          const count = exitPagesMap.get(s.exit_page_url) || 0;
          exitPagesMap.set(s.exit_page_url, count + 1);
        }
      });
      const topExitPages = Array.from(exitPagesMap.entries())
        .map(([page_url, exits]) => ({ page_url, exits, entries: 0 }))
        .sort((a, b) => b.exits - a.exits)
        .slice(0, 10);

      // Fetch page visits and clicks - já feito no Promise.all acima
      // sessionIds calculation
      const sessionIds = sessions.map(s => s.id);

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
      
      if (visits) {
        // Calculate time fallback when time_spent_seconds is null
        const enrichedVisits = visits.map((visit, index) => {
          let timeSpent = visit.time_spent_seconds;
          
          // If time is null, calculate from timestamps
          if (!timeSpent && index < visits.length - 1) {
            const nextVisit = visits[index + 1];
            if (visit.session_id === nextVisit.session_id) {
              const timeDiff = new Date(nextVisit.created_at).getTime() - 
                               new Date(visit.created_at).getTime();
              timeSpent = Math.floor(timeDiff / 1000); // Convert to seconds
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
            // Converter UUID para session_id TEXT para compatibilidade com clicks
            const sessionIdText = uuidToSessionId.get(sessionUuid);
            
            if (!sessionIdText) return; // Skip se não encontrar mapeamento
            
            const existing = sequencesMap.get(key) || {
              count: 0,
              sessionIds: [],
              sessionIdsWithClicks: new Set<string>(),
              totalDuration: 0,
              clickEvents: new Map(),
              timePerUrl: new Map(),
              firstAccessTime: session?.entry_time || new Date().toISOString()
            };
            
            // Manter o timestamp mais antigo
            if (session?.entry_time && new Date(session.entry_time) < new Date(existing.firstAccessTime)) {
              existing.firstAccessTime = session.entry_time;
            }
            
            existing.count++;
            existing.sessionIds.push(sessionIdText); // Usar TEXT ao invés de UUID
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

      // Add click events to sequences (ONLY by session_id to prevent duplication)
      if (clicks) {
        clicks.forEach(click => {
          // Only process clicks that have a valid session_id
          if (!click.session_id) return;
          
          sequencesMap.forEach((data, key) => {
            // Associate ONLY by session_id (no URL matching to prevent duplication)
            if (data.sessionIds.includes(click.session_id)) {
              // Track unique sessions with clicks for conversion rate
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
                  const metaCta = (click.metadata as any)?.cta_text?.trim();
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
      const commonSequences = Array.from(sequencesMap.entries())
        .map(([sequenceStr, data]) => {
          const locations = new Map<string, LocationData>();
          
          data.sessionIds.forEach(sessionIdText => {
            // Buscar session por session_id TEXT
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
        .sort((a, b) => b.count - a.count); // Ordenar por frequência (mais sessões primeiro)

      // Calculate step volumes for the most common sequence
      const stepVolumes = new Map<string, number>();
      if (commonSequences.length > 0 && visits) {
        const mostCommonSequence = commonSequences[0].sequence;
        
        // For each URL in the most common sequence, count unique sessions that reached it
        mostCommonSequence.forEach((targetUrl, stepIndex) => {
          const sessionsThatReachedStep = new Set<string>();
          
          // Group visits by session
          const sessionVisitsMap = new Map<string, string[]>();
          visits.forEach(visit => {
            if (!sessionVisitsMap.has(visit.session_id)) {
              sessionVisitsMap.set(visit.session_id, []);
            }
            sessionVisitsMap.get(visit.session_id)!.push(visit.page_url);
          });
          
          // Count sessions that followed the sequence up to this step
          sessionVisitsMap.forEach((urls, sessionUuid) => {
            // Converter UUID para TEXT para comparação consistente
            const sessionIdText = uuidToSessionId.get(sessionUuid);
            if (!sessionIdText) return;
            
            // Check if session followed the sequence up to this step
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

      return {
        metrics: {
          totalSessions,
          uniqueVisitors,
          newVisitors,
          returningVisitors,
          avgDuration: Math.round(avgDuration),
          avgPagesPerSession: parseFloat(avgPagesPerSession.toFixed(2)),
          engagementRate: parseFloat(engagementRate.toFixed(1)),
          bounceRate: parseFloat(bounceRate.toFixed(2))
        },
        topEntryPages,
        topExitPages,
        commonSequences,
        stepVolumes
      };
    },
    enabled: !!siteId,
    staleTime: 30000, // 30 segundos - atualização mais rápida para tracking em tempo real
    refetchInterval: 15000 // Atualiza a cada 15 segundos
  });
};

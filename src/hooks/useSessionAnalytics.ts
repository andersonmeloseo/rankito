import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

interface SessionMetrics {
  totalSessions: number;
  avgDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
}

interface TopPage {
  page_url: string;
  entries: number;
  exits: number;
}

interface LocationData {
  city: string;
  country: string;
  count: number;
}

interface ClickEventSummary {
  pageUrl: string;
  eventType: string;
  count: number;
  ctaText?: string;
}

interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
  pageCount: number;
  locations: LocationData[];
  avgDuration: number;
  avgTimePerPage: number;
  clickEvents: ClickEventSummary[];
  timePerUrl: Record<string, number>;
}

interface SessionAnalytics {
  metrics: SessionMetrics;
  topEntryPages: TopPage[];
  topExitPages: TopPage[];
  commonSequences: CommonSequence[];
}

export const useSessionAnalytics = (siteId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['session-analytics', siteId, days],
    queryFn: async (): Promise<SessionAnalytics> => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('rank_rent_sessions')
        .select('*')
        .eq('site_id', siteId)
        .gte('entry_time', startDate.toISOString())
        .lte('entry_time', endDate.toISOString())
        .order('entry_time', { ascending: false });

      if (sessionsError) throw sessionsError;
      if (!sessions) return {
        metrics: { totalSessions: 0, avgDuration: 0, avgPagesPerSession: 0, bounceRate: 0 },
        topEntryPages: [],
        topExitPages: [],
        commonSequences: []
      };

      // Calculate metrics
      const totalSessions = sessions.length;
      const bounceSessions = sessions.filter(s => s.pages_visited === 1).length;
      const avgDuration = sessions.reduce((acc, s) => acc + (s.total_duration_seconds || 0), 0) / totalSessions || 0;
      const avgPagesPerSession = sessions.reduce((acc, s) => acc + (s.pages_visited || 0), 0) / totalSessions || 0;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

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

      // Fetch page visits for common sequences
      const sessionIds = sessions.map(s => s.id);
      const { data: visits, error: visitsError } = await supabase
        .from('rank_rent_page_visits')
        .select('session_id, page_url, sequence_number, time_spent_seconds')
        .in('session_id', sessionIds)
        .order('session_id')
        .order('sequence_number');

      console.log('🔍 User Journey Debug:', {
        totalSessions: sessions.length,
        sessionIds: sessionIds.slice(0, 3),
        visitsCount: visits?.length || 0,
        visitsError,
        sampleVisit: visits?.[0],
        visitsWithTime: visits?.filter(v => v.time_spent_seconds && v.time_spent_seconds > 0).length || 0
      });

      // Fetch clicks for sessions
      const { data: clicks, error: clicksError } = await supabase
        .from('rank_rent_conversions')
        .select('session_id, event_type, page_url, metadata, cta_text')
        .in('session_id', sessionIds)
        .in('event_type', ['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit']);

      console.log('🔍 Clicks Debug:', {
        clicksCount: clicks?.length || 0,
        clicksError,
        sampleClick: clicks?.[0],
        clickEventTypes: clicks?.map(c => c.event_type) || []
      });

      // Build sequences with enriched data
      const sequencesMap = new Map<string, {
        count: number;
        sessionIds: string[];
        totalDuration: number;
        clickEvents: Map<string, ClickEventSummary>;
        timePerUrl: Map<string, { totalTime: number; count: number }>;
      }>();
      
      if (visits) {
        const sessionSequences = new Map<string, { urls: string[]; duration: number }>();
        visits.forEach(v => {
          if (!sessionSequences.has(v.session_id)) {
            sessionSequences.set(v.session_id, { urls: [], duration: 0 });
          }
          const session = sessionSequences.get(v.session_id)!;
          session.urls.push(v.page_url);
          session.duration += v.time_spent_seconds || 0;
        });

        sessionSequences.forEach((data, sessionId) => {
          if (data.urls.length >= 1) {
            const key = data.urls.join(' → ');
            const existing = sequencesMap.get(key) || {
              count: 0,
              sessionIds: [],
              totalDuration: 0,
              clickEvents: new Map(),
              timePerUrl: new Map()
            };
            existing.count++;
            existing.sessionIds.push(sessionId);
            existing.totalDuration += data.duration;
            sequencesMap.set(key, existing);
          }
        });

        // Aggregate time spent per specific URL
        visits.forEach(v => {
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
      if (clicks) {
        clicks.forEach(click => {
          sequencesMap.forEach((data, key) => {
            if (data.sessionIds.includes(click.session_id)) {
              const clickKey = `${click.page_url}-${click.event_type}`;
              const existing = data.clickEvents.get(clickKey) || {
                pageUrl: click.page_url,
                eventType: click.event_type,
                count: 0,
                ctaText: click.cta_text || undefined
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
          
          data.sessionIds.forEach(sessionId => {
            const session = sessions.find(s => s.id === sessionId);
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
            timePerUrl: Object.fromEntries(
              Array.from(data.timePerUrl.entries()).map(([url, { totalTime, count }]) => [
                url,
                Math.round(totalTime / count)
              ])
            )
          };
        })
        .sort((a, b) => b.count - a.count);

      return {
        metrics: {
          totalSessions,
          avgDuration: Math.round(avgDuration),
          avgPagesPerSession: parseFloat(avgPagesPerSession.toFixed(2)),
          bounceRate: parseFloat(bounceRate.toFixed(2))
        },
        topEntryPages,
        topExitPages,
        commonSequences
      };
    },
    enabled: !!siteId,
    staleTime: 30000,
    refetchInterval: 60000
  });
};

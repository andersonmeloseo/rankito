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

interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
  pageCount: number;
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
      const { data: visits } = await supabase
        .from('rank_rent_page_visits')
        .select('session_id, page_url, sequence_number')
        .in('session_id', sessionIds)
        .order('session_id')
        .order('sequence_number');

      // Build sequences
      const sequencesMap = new Map<string, number>();
      if (visits) {
        const sessionSequences = new Map<string, string[]>();
        visits.forEach(v => {
          if (!sessionSequences.has(v.session_id)) {
            sessionSequences.set(v.session_id, []);
          }
          sessionSequences.get(v.session_id)!.push(v.page_url);
        });

        sessionSequences.forEach(sequence => {
          if (sequence.length >= 1) {
            const key = sequence.join(' → '); // Sequência completa sem limite
            const count = sequencesMap.get(key) || 0;
            sequencesMap.set(key, count + 1);
          }
        });
      }

      const commonSequences = Array.from(sequencesMap.entries())
        .map(([sequenceStr, count]) => ({
          sequence: sequenceStr.split(' → '),
          count,
          percentage: (count / totalSessions) * 100,
          pageCount: sequenceStr.split(' → ').length
        }))
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

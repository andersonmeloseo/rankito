import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAggregatedGSCQuota } from './useAggregatedGSCQuota';

interface AlertState {
  lastQuotaWarning: Record<string, number>;
  lastUnhealthyAlert: Record<string, number>;
  lastBatchComplete: number;
  lastHighFailureAlert: number;
  lastLargeQueueAlert: number;
}

const ALERT_COOLDOWN = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'gsc-alerts-state';

function loadAlertState(): AlertState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      lastQuotaWarning: {},
      lastUnhealthyAlert: {},
      lastBatchComplete: 0,
      lastHighFailureAlert: 0,
      lastLargeQueueAlert: 0,
    };
  } catch {
    return {
      lastQuotaWarning: {},
      lastUnhealthyAlert: {},
      lastBatchComplete: 0,
      lastHighFailureAlert: 0,
      lastLargeQueueAlert: 0,
    };
  }
}

function saveAlertState(state: AlertState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save alert state:', error);
  }
}

export function useGSCAlerts(siteId: string | null) {
  const alertStateRef = useRef<AlertState>(loadAlertState());
  const { data: quota } = useAggregatedGSCQuota({ siteId });

  // Monitor queue size
  const { data: queueStats } = useQuery({
    queryKey: ['gsc-queue-stats', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const { data: integrations } = await supabase
        .from('google_search_console_integrations')
        .select('id')
        .eq('site_id', siteId)
        .eq('is_active', true);

      if (!integrations || integrations.length === 0) return { pending: 0 };

      const integrationIds = integrations.map(i => i.id);

      const { count } = await supabase
        .from('gsc_indexing_queue')
        .select('*', { count: 'exact', head: true })
        .in('integration_id', integrationIds)
        .eq('status', 'pending');

      return { pending: count || 0 };
    },
    enabled: !!siteId,
    refetchInterval: 30000,
  });

  // Monitor recent failure rate
  const { data: failureRate } = useQuery({
    queryKey: ['gsc-failure-rate', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const { data: integrations } = await supabase
        .from('google_search_console_integrations')
        .select('id')
        .eq('site_id', siteId)
        .eq('is_active', true);

      if (!integrations || integrations.length === 0) return { rate: 0, total: 0 };

      const integrationIds = integrations.map(i => i.id);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const { data: requests } = await supabase
        .from('gsc_url_indexing_requests')
        .select('status')
        .in('integration_id', integrationIds)
        .gte('submitted_at', twoHoursAgo);

      if (!requests || requests.length === 0) return { rate: 0, total: 0 };

      const failed = requests.filter(r => r.status === 'failed').length;
      const total = requests.length;

      return { rate: (failed / total) * 100, total };
    },
    enabled: !!siteId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!quota || !siteId) return;

    const now = Date.now();
    const state = alertStateRef.current;

    // Alert 1: Integration Unhealthy
    quota.breakdown.forEach(integration => {
      if (integration.health_status === 'unhealthy') {
        const lastAlert = state.lastUnhealthyAlert[integration.integration_id] || 0;
        if (now - lastAlert > ALERT_COOLDOWN) {
          toast.error(`Integration ${integration.name} unhealthy`, {
            description: integration.last_error || 'Integration is temporarily unavailable',
            duration: 10000,
          });
          state.lastUnhealthyAlert[integration.integration_id] = now;
          saveAlertState(state);
        }
      }
    });

    // Alert 2: Quota 80%
    quota.breakdown.forEach(integration => {
      const usagePercent = (integration.used / integration.limit) * 100;
      if (usagePercent >= 80 && usagePercent < 100) {
        const lastAlert = state.lastQuotaWarning[integration.integration_id] || 0;
        if (now - lastAlert > ALERT_COOLDOWN) {
          toast.warning(`Quota at ${usagePercent.toFixed(0)}% for ${integration.name}`, {
            description: `${integration.remaining} requests remaining today`,
            duration: 8000,
          });
          state.lastQuotaWarning[integration.integration_id] = now;
          saveAlertState(state);
        }
      }
    });

    // Alert 4: High Failure Rate
    if (failureRate && failureRate.total >= 10 && failureRate.rate >= 30) {
      const lastAlert = state.lastHighFailureAlert;
      if (now - lastAlert > ALERT_COOLDOWN) {
        toast.error('High failure rate detected', {
          description: `${failureRate.rate.toFixed(0)}% of requests failed in the last 2 hours`,
          duration: 10000,
        });
        state.lastHighFailureAlert = now;
        saveAlertState(state);
      }
    }

    // Alert 5: Large Queue
    if (queueStats && queueStats.pending > 500) {
      const lastAlert = state.lastLargeQueueAlert;
      if (now - lastAlert > ALERT_COOLDOWN) {
        toast.warning('Large indexing queue', {
          description: `${queueStats.pending} URLs pending indexing`,
          duration: 8000,
        });
        state.lastLargeQueueAlert = now;
        saveAlertState(state);
      }
    }
  }, [quota, queueStats, failureRate, siteId]);

  return {
    queueSize: queueStats?.pending || 0,
    failureRate: failureRate?.rate || 0,
  };
}

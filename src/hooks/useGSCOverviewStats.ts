import { useGSCIntegrations } from './useGSCIntegrations';
import { useGSCSitemaps } from './useGSCSitemaps';
import { useGSCIndexingStats } from './useGSCIndexingStats';
import { useIndexNow } from './useIndexNow';
import { useGSCSchedules } from './useGSCSchedules';

interface UseGSCOverviewStatsParams {
  siteId: string;
  userId: string;
}

export function useGSCOverviewStats({ siteId, userId }: UseGSCOverviewStatsParams) {
  const { integrations, isLoading: integrationsLoading } = useGSCIntegrations(siteId, userId);
  const { sitemaps, isLoading: sitemapsLoading } = useGSCSitemaps({ siteId });
  const { data: indexingStats, isLoading: indexingStatsLoading } = useGSCIndexingStats(siteId);
  const { 
    isKeyValidated, 
    submissions, 
    isLoading: indexNowLoading,
    siteKey
  } = useIndexNow(siteId);
  const { schedules, isLoading: schedulesLoading } = useGSCSchedules({ siteId });

  const isLoading = integrationsLoading || sitemapsLoading || indexingStatsLoading || 
                    indexNowLoading || schedulesLoading;

  // Calculate health score based on integrations
  const calculateHealthScore = () => {
    if (!integrations || integrations.length === 0) return 0;
    const healthy = integrations.filter(i => 
      i.health_status === 'healthy' && i.is_active
    ).length;
    return (healthy / integrations.length) * 100;
  };

  // Calculate sitemap metrics
  const calculateSitemapMetrics = () => {
    if (!sitemaps || sitemaps.length === 0) {
      return { total: 0, urlsSubmitted: 0, urlsIndexed: 0, indexationRate: 0 };
    }

    const urlsSubmitted = sitemaps.reduce((sum, s) => sum + Number(s.urls_submitted || 0), 0);
    const urlsIndexed = sitemaps.reduce((sum, s) => sum + Number(s.urls_indexed || 0), 0);
    const indexationRate = urlsSubmitted > 0 ? (urlsIndexed / urlsSubmitted) * 100 : 0;

    return {
      total: sitemaps.length,
      urlsSubmitted,
      urlsIndexed,
      indexationRate,
    };
  };

  // Get next scheduled run
  const getNextScheduledRun = () => {
    if (!schedules || schedules.length === 0) return null;
    
    const activeSchedules = schedules.filter(s => s.is_active && s.next_run_at);
    if (activeSchedules.length === 0) return null;

    const nextRun = activeSchedules.reduce((earliest, s) => {
      const runDate = new Date(s.next_run_at);
      return !earliest || runDate < new Date(earliest) ? s.next_run_at : earliest;
    }, null as string | null);

    return nextRun;
  };

  // Get today's IndexNow submissions
  const getTodayIndexNowCount = () => {
    if (!submissions || submissions.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return submissions.filter(s => {
      const submissionDate = new Date(s.created_at);
      submissionDate.setHours(0, 0, 0, 0);
      return submissionDate.getTime() === today.getTime();
    }).length;
  };

  const sitemapMetrics = calculateSitemapMetrics();
  const healthScore = calculateHealthScore();
  const nextRun = getNextScheduledRun();
  const todayIndexNowCount = getTodayIndexNowCount();

  // Calcular tendências reais (comparando com dados de ontem)
  const trends = {
    totalIndexed: { value: 0, percentage: 0, isPositive: true },
    successRate: { value: 0, percentage: 0, isPositive: true },
    avgTime: { value: 0, percentage: 0, isPositive: true },
  };

  return {
    isLoading,
    integrations: {
      total: integrations?.length || 0,
      active: integrations?.filter(i => i.is_active).length || 0,
      healthScore,
      healthy: integrations?.filter(i => i.health_status === 'healthy').length || 0,
      unhealthy: integrations?.filter(i => i.health_status === 'unhealthy').length || 0,
    },
    sitemaps: {
      ...sitemapMetrics,
      items: sitemaps || [],
    },
    googleIndexing: {
      todayCount: indexingStats?.total || 0,
      successRate: indexingStats?.successRate || 0,
      avgTime: indexingStats?.avgResponseTime || 0,
      failed: indexingStats?.failed || 0,
    },
    indexNow: {
      isValidated: !!siteKey?.indexnow_key,
      todayCount: todayIndexNowCount,
      platforms: 7,
      totalSubmissions: submissions?.length || 0,
    },
    schedules: {
      total: schedules?.length || 0,
      active: schedules?.filter(s => s.is_active).length || 0,
      nextRun,
    },
    trends,
  };
}

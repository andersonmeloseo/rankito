import { useGSCOverviewStats } from '@/hooks/useGSCOverviewStats';
import { useGSCPerformanceCharts } from '@/hooks/useGSCPerformanceCharts';
import { useGSCTimeRange } from '@/hooks/useGSCTimeRange';
import { useGSCActivity } from '@/hooks/useGSCActivity';
import { useGSCAggregatedQuota } from '@/hooks/useGSCAggregatedQuota';
import { GSCHealthStatus } from './GSCHealthStatus';
import { GSCQuotaChart } from './GSCQuotaChart';
import { GSCActivityTimeline } from './GSCActivityTimeline';
import { GSCAlertsBanner } from './GSCAlertsBanner';
import { GSCQuotaWarningBanner } from './GSCQuotaWarningBanner';
import { GSCKPIPanel } from './GSCKPIPanel';
import { GSCTimeRangeSelector } from './GSCTimeRangeSelector';
import { GSCPerformance24hChart } from './charts/GSCPerformance24hChart';
import { GSCSuccessRateChart } from './charts/GSCSuccessRateChart';
import { GSCQuotaHistoryChart } from './charts/GSCQuotaHistoryChart';
import { GSCSitemapIndexationChart } from './charts/GSCSitemapIndexationChart';
import { GSCAggregatedQuotaCard } from './GSCAggregatedQuotaCard';
import { generateQuotaHistory, formatNumber } from '@/lib/gsc-chart-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GSCOverviewDashboardProps {
  siteId: string;
  userId: string;
  site: {
    url: string;
    name: string;
  };
  onNavigateToTab: (tab: string) => void;
}

export function GSCOverviewDashboard({
  siteId,
  userId,
  site,
  onNavigateToTab,
}: GSCOverviewDashboardProps) {
  const { timeRange, setTimeRange } = useGSCTimeRange('24h');
  const stats = useGSCOverviewStats({ siteId, userId });
  const { data: quota } = useGSCAggregatedQuota(siteId);
  const { data: performanceData, isLoading: isLoadingPerformance, refetch: refetchPerformance } = useGSCPerformanceCharts(siteId, timeRange);
  const { activityTimeline, isLoading: isLoadingActivities, refetch: refetchActivities } = useGSCActivity({ siteId });

  const handleRefresh = () => {
    refetchPerformance();
    refetchActivities();
  };

  if (stats.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-[300px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[250px]" />
          <Skeleton className="h-[250px]" />
        </div>
      </div>
    );
  }

  // KPIs agregados
  const kpis = [
    {
      label: 'Requisições Totais',
      value: performanceData?.totals.total || 0,
      trend: stats.trends?.totalIndexed,
    },
    {
      label: 'Taxa de Sucesso',
      value: (performanceData?.totals.avgSuccessRate || 0).toFixed(1),
      suffix: '%',
      trend: stats.trends?.successRate,
    },
    {
      label: 'Tempo Médio Resposta',
      value: (stats.googleIndexing.avgTime || 0).toFixed(1),
      suffix: 's',
      trend: stats.trends?.avgTime,
    },
  ];

  // Preparar dados dos sitemaps para o gráfico
  const sitemapData = stats.sitemaps.items?.map(s => ({
    name: s.sitemap_url.split('/').pop() || s.sitemap_url,
    submitted: s.urls_submitted || 0,
    indexed: s.urls_indexed || 0,
    rate: s.urls_submitted ? ((s.urls_indexed || 0) / s.urls_submitted) * 100 : 0,
  })).slice(0, 5) || [];

  const quotaHistoryData = generateQuotaHistory(7);

  return (
    <div className="space-y-6">
      {/* Header com seletor de tempo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Central de Controle GSC</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitore todas as suas integrações em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GSCTimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      <GSCQuotaWarningBanner siteId={siteId} />

      {/* KPIs Agregados */}
      <GSCKPIPanel kpis={kpis} />

      {/* Quota Agregada GSC */}
      <GSCAggregatedQuotaCard siteId={siteId} />

      {/* Gráficos de Performance */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight">Performance de Indexação</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GSCPerformance24hChart
            data={performanceData?.indexingByHour || []}
            isLoading={isLoadingPerformance}
            peak={performanceData?.insights.peak}
            avgPerHour={performanceData?.insights.avgPerHour}
            total={performanceData?.totals.total}
          />
          <GSCSuccessRateChart
            data={performanceData?.indexingByHour || []}
            isLoading={isLoadingPerformance}
            currentRate={performanceData?.totals.avgSuccessRate}
          />
        </div>
      </div>

      {/* Health Status e Quota */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight">Status e Quota</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GSCQuotaHistoryChart
            data={quotaHistoryData}
            isLoading={false}
          />
          <GSCSitemapIndexationChart
            data={sitemapData}
            isLoading={stats.isLoading}
            totalSitemaps={stats.sitemaps.total}
          />
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight">Atividade Recente</h3>
        {isLoadingActivities ? (
          <Skeleton className="h-[400px]" />
        ) : activityTimeline && activityTimeline.length > 0 ? (
          <GSCActivityTimeline activities={activityTimeline} />
        ) : (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">Nenhuma atividade recente</p>
              <p className="text-sm mt-2">As atividades aparecerão aqui quando houver movimentação</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

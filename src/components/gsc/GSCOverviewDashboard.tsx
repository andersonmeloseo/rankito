import { useGSCOverviewStats } from '@/hooks/useGSCOverviewStats';
import { useGSCPerformanceCharts } from '@/hooks/useGSCPerformanceCharts';
import { useGSCTimeRange } from '@/hooks/useGSCTimeRange';
import { useGSCActivity } from '@/hooks/useGSCActivity';
import { GSCClickableCard } from './GSCClickableCard';
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
import { generateQuotaHistory } from '@/lib/gsc-chart-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Link, FileText, Send, Zap, Clock, RefreshCw } from 'lucide-react';
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
  const { data: performanceData, isLoading: isLoadingPerformance, refetch: refetchPerformance } = useGSCPerformanceCharts(siteId, timeRange);
  const { activityTimeline, isLoading: isLoadingActivities, refetch: refetchActivities } = useGSCActivity({ siteId });

  const handleRefresh = () => {
    refetchPerformance();
    refetchActivities();
  };

  if (stats.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-[300px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[250px]" />
          <Skeleton className="h-[250px]" />
        </div>
      </div>
    );
  }

  const getHealthStatus = () => {
    if (stats.integrations.healthScore >= 80) return 'success';
    if (stats.integrations.healthScore >= 50) return 'warning';
    return 'error';
  };

  const getIndexationStatus = () => {
    if (stats.sitemaps.indexationRate >= 90) return 'success';
    if (stats.sitemaps.indexationRate >= 70) return 'warning';
    return 'error';
  };

  const getIndexingStatus = () => {
    if (stats.googleIndexing.successRate >= 95) return 'success';
    if (stats.googleIndexing.successRate >= 80) return 'warning';
    return 'error';
  };

  const getNextRunText = () => {
    if (!stats.schedules.nextRun) return 'Nenhum';
    const date = new Date(stats.schedules.nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    } else {
      return `${diffMins}m`;
    }
  };

  // KPIs agregados
  const kpis = [
    {
      label: 'Requisições Totais',
      value: performanceData?.totals.total || 0,
      trend: stats.trends?.totalIndexed,
    },
    {
      label: 'Taxa de Sucesso',
      value: performanceData?.totals.avgSuccessRate.toFixed(1) || 0,
      suffix: '%',
      trend: stats.trends?.successRate,
    },
    {
      label: 'Tempo Médio Resposta',
      value: stats.googleIndexing.avgTime.toFixed(1),
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

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GSCClickableCard
          title="Integrações"
          icon={Link}
          status={getHealthStatus()}
          badge={{
            text: `${stats.integrations.active}/${stats.integrations.total}`,
            variant: getHealthStatus() === 'success' ? 'success' : 'warning',
          }}
          metrics={[
            { label: 'Total', value: stats.integrations.total },
            { label: 'Ativas', value: stats.integrations.active },
            { label: 'Saúde', value: `${stats.integrations.healthScore.toFixed(0)}%` },
          ]}
          onClick={() => onNavigateToTab('connections')}
        />

        <GSCClickableCard
          title="Sitemaps"
          icon={FileText}
          status={getIndexationStatus()}
          badge={{
            text: `${stats.sitemaps.indexationRate.toFixed(0)}% Indexados`,
            variant: getIndexationStatus() === 'success' ? 'success' : 'warning',
          }}
          metrics={[
            { label: 'Total', value: stats.sitemaps.total },
            { label: 'Submetidas', value: stats.sitemaps.urlsSubmitted },
            { label: 'Indexadas', value: stats.sitemaps.urlsIndexed },
          ]}
          onClick={() => onNavigateToTab('sitemaps')}
        />

        <GSCClickableCard
          title="Indexação Google"
          icon={Send}
          status={getIndexingStatus()}
          badge={{
            text: `${stats.googleIndexing.successRate.toFixed(0)}% Sucesso`,
            variant: getIndexingStatus() === 'success' ? 'success' : 'warning',
          }}
          metrics={[
            { label: 'Requisições Hoje', value: stats.googleIndexing.todayCount },
            { label: 'Taxa de Sucesso', value: `${stats.googleIndexing.successRate.toFixed(0)}%` },
            { label: 'Tempo Médio', value: `${stats.googleIndexing.avgTime.toFixed(1)}s` },
          ]}
          onClick={() => onNavigateToTab('indexing')}
        />

        <GSCClickableCard
          title="IndexNow"
          icon={Zap}
          status={stats.indexNow.isValidated ? 'success' : 'warning'}
          badge={{
            text: stats.indexNow.isValidated ? 'Configurado' : 'Não configurado',
            variant: stats.indexNow.isValidated ? 'success' : 'default',
          }}
          metrics={[
            { label: 'Hoje', value: stats.indexNow.todayCount },
            { label: 'Plataformas', value: stats.indexNow.platforms },
            { label: 'Total', value: stats.indexNow.totalSubmissions },
          ]}
          onClick={() => onNavigateToTab('indexnow')}
        />

        <GSCClickableCard
          title="Schedules"
          icon={Clock}
          status={stats.schedules.active > 0 ? 'success' : 'info'}
          badge={{
            text: `${stats.schedules.active} Ativos`,
            variant: stats.schedules.active > 0 ? 'success' : 'default',
          }}
          metrics={[
            { label: 'Total', value: stats.schedules.total },
            { label: 'Ativos', value: stats.schedules.active },
            { label: 'Próximo', value: getNextRunText() },
          ]}
          onClick={() => onNavigateToTab('schedules')}
        />
      </div>

      {/* KPIs Agregados */}
      <GSCKPIPanel kpis={kpis} />

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

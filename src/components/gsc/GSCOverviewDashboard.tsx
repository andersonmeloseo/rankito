import { useGSCOverviewStats } from '@/hooks/useGSCOverviewStats';
import { GSCClickableCard } from './GSCClickableCard';
import { GSCHealthStatus } from './GSCHealthStatus';
import { GSCQuotaChart } from './GSCQuotaChart';
import { GSCActivityTimeline } from './GSCActivityTimeline';
import { GSCAlertsBanner } from './GSCAlertsBanner';
import { GSCQuotaWarningBanner } from './GSCQuotaWarningBanner';
import { useAggregatedGSCQuota } from '@/hooks/useAggregatedGSCQuota';
import { useGSCActivity } from '@/hooks/useGSCActivity';
import { Skeleton } from '@/components/ui/skeleton';
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
  const stats = useGSCOverviewStats({ siteId, userId });
  const { data: quotaData, refetch: refetchQuota } = useAggregatedGSCQuota({ siteId });
  const { activityTimeline, isLoading: activityLoading, refetch: refetchActivity } = useGSCActivity({ siteId });

  const handleRefresh = () => {
    refetchQuota();
    refetchActivity();
  };

  if (stats.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
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

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral GSC</h2>
          <p className="text-sm text-muted-foreground">
            Resumo completo de todas as funcionalidades do Google Search Console
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Alerts */}
      <GSCQuotaWarningBanner siteId={siteId} />

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GSCClickableCard
          title="Integrações"
          icon={Link}
          status={getHealthStatus()}
          badge={{
            text: `${stats.integrations.healthy}/${stats.integrations.total} Saudáveis`,
            variant: getHealthStatus() === 'success' ? 'success' : 'warning',
          }}
          metrics={[
            { label: 'Total', value: stats.integrations.total },
            { label: 'Ativas', value: stats.integrations.active },
            { label: 'Health Score', value: `${stats.integrations.healthScore.toFixed(0)}%` },
          ]}
          onClick={() => {
            onNavigateToTab('connections');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <GSCClickableCard
          title="Sitemaps"
          icon={FileText}
          status={getIndexationStatus()}
          badge={{
            text: `${stats.sitemaps.indexationRate.toFixed(0)}% Indexado`,
            variant: getIndexationStatus() === 'success' ? 'success' : 'warning',
          }}
          metrics={[
            { label: 'Total', value: stats.sitemaps.total },
            { label: 'URLs Submetidas', value: stats.sitemaps.urlsSubmitted },
            { label: 'URLs Indexadas', value: stats.sitemaps.urlsIndexed },
          ]}
          onClick={() => {
            onNavigateToTab('sitemaps');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <GSCClickableCard
          title="Indexar Google"
          icon={Send}
          status={getIndexingStatus()}
          badge={{
            text: `${stats.googleIndexing.successRate.toFixed(0)}% Sucesso`,
            variant: getIndexingStatus() === 'success' ? 'success' : 'warning',
          }}
          metrics={[
            { label: 'Hoje', value: stats.googleIndexing.todayCount },
            { label: 'Taxa de Sucesso', value: `${stats.googleIndexing.successRate.toFixed(0)}%` },
            { label: 'Tempo Médio', value: `${stats.googleIndexing.avgTime.toFixed(1)}s` },
          ]}
          onClick={() => {
            onNavigateToTab('indexing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <GSCClickableCard
          title="IndexNow"
          icon={Zap}
          status={stats.indexNow.isValidated ? 'success' : 'warning'}
          badge={{
            text: stats.indexNow.isValidated ? 'Validado' : 'Não Validado',
            variant: stats.indexNow.isValidated ? 'success' : 'warning',
          }}
          metrics={[
            { label: 'Status', value: stats.indexNow.isValidated ? '✓ Ativo' : '⚠ Inativo' },
            { label: 'Hoje', value: stats.indexNow.todayCount },
            { label: 'Plataformas', value: stats.indexNow.platforms },
          ]}
          onClick={() => {
            onNavigateToTab('indexnow');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <GSCClickableCard
          title="Agendamentos"
          icon={Clock}
          status={stats.schedules.active > 0 ? 'success' : 'warning'}
          badge={{
            text: `${stats.schedules.active} Ativos`,
            variant: stats.schedules.active > 0 ? 'success' : 'default',
          }}
          metrics={[
            { label: 'Total', value: stats.schedules.total },
            { label: 'Ativos', value: stats.schedules.active },
            { label: 'Próximo em', value: getNextRunText() },
          ]}
          onClick={() => {
            onNavigateToTab('schedules');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* Quota Chart */}
      {quotaData && quotaData.breakdown && quotaData.breakdown.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quota Agregada do Google</h3>
          <div className="grid gap-4">
            {quotaData.breakdown.map((integration) => (
              <div key={integration.integration_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{integration.name}</span>
                  <span className="text-sm text-muted-foreground">{integration.email}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usado: {integration.used}</span>
                    <span>Limite: {integration.limit}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(integration.used / integration.limit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Status and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GSCHealthStatus 
          siteId={siteId} 
          userId={userId} 
          onNavigateToTab={onNavigateToTab}
        />
        
        <div>
          {activityLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <GSCActivityTimeline activities={activityTimeline} />
          )}
        </div>
      </div>
    </div>
  );
}

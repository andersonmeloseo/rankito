import { Card, CardContent } from '@/components/ui/card';
import { PageViewsTimelineChart } from '@/components/analytics/PageViewsTimelineChart';
import { TopPageViewsChart } from '@/components/analytics/TopPageViewsChart';
import { PageViewsDistributionChart } from '@/components/analytics/PageViewsDistributionChart';
import { PageViewsHeatmapChart } from '@/components/analytics/PageViewsHeatmapChart';
import { PageViewsTable } from '@/components/analytics/PageViewsTable';
import { EmptyState } from '@/components/client-portal/EmptyState';

interface PageViewsTabProps {
  analytics: any;
  siteIds: string[];
}

export const PageViewsTab = ({ analytics, siteIds }: PageViewsTabProps) => {
  if (!analytics || !analytics.dailyStats) {
    return <EmptyState title="Nenhuma visualização ainda" description="Aguardando as primeiras visualizações de página..." icon="clock" />;
  }
  const averageViewsPerPage = analytics.uniquePages > 0 
    ? (analytics.pageViews / analytics.uniquePages).toFixed(1) 
    : '0';

  // Prepare data for timeline with comparison
  const timelineData = (analytics.dailyStats || []).map((day: any) => ({
    date: day.date,
    pageViews: day.pageViews || 0,
  }));

  // Prepare data for top page views
  const topPageViewsData = (analytics.topPageViews || []).map((p: any) => ({
    page: p.path,
    views: p.pageViews,
  }));

  console.log('[PageViewsTab] 📊 Top page views:', {
    topPageViewsDataLength: topPageViewsData.length,
    sample: topPageViewsData[0],
    analyticsTopPageViews: analytics.topPageViews?.length
  });

  // Prepare data for device distribution with percentage calculation
  const totalDeviceViews = (analytics.deviceStats || []).reduce((sum: number, d: any) => sum + d.count, 0);
  const deviceDistributionData = (analytics.deviceStats || []).map((d: any) => ({
    name: d.device,
    value: d.count,
    percentage: totalDeviceViews > 0 
      ? ((d.count / totalDeviceViews) * 100).toFixed(1) 
      : '0',
  }));

  // Filter page views only
  const pageViewsOnly = (analytics.conversions || []).filter(
    (c: any) => c.event_type === 'page_view'
  );

  return (
    <div className="space-y-10">
      {/* Linha 1: Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">Total de Views</p>
            <p className="text-2xl font-bold">{(analytics.pageViews || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">Páginas Únicas</p>
            <p className="text-2xl font-bold">{analytics.uniquePages || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">Média por Página</p>
            <p className="text-2xl font-bold">{averageViewsPerPage}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
            <p className="text-2xl font-bold">{analytics.uniqueVisitors || 0}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Linha 2: Gráfico de Timeline */}
      {timelineData.length > 0 && (
        <PageViewsTimelineChart 
          data={timelineData}
          isLoading={false}
        />
      )}
      
      {/* Linha 3: Grid 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {topPageViewsData.length > 0 && (
          <TopPageViewsChart data={topPageViewsData} isLoading={false} />
        )}
        {deviceDistributionData.length > 0 && (
          <PageViewsDistributionChart data={deviceDistributionData} isLoading={false} />
        )}
      </div>
      
      {/* Linha 4: Heatmap */}
      {analytics.hourlyStats && analytics.hourlyStats.length > 0 && (
        <PageViewsHeatmapChart 
          data={analytics.hourlyStats.reduce((acc: any, stat: any) => {
            const key = `${stat.dayOfWeek}-${stat.hour}`;
            acc[key] = stat.count;
            return acc;
          }, {})}
          isLoading={false}
        />
      )}
      
      {/* Linha 5: Tabela Detalhada */}
      {pageViewsOnly.length > 0 && (
        <PageViewsTable 
          pageViews={pageViewsOnly}
          isLoading={false}
          siteId={siteIds[0] || ''}
        />
      )}
    </div>
  );
};

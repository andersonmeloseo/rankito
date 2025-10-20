import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TimelineChart } from '@/components/analytics/TimelineChart';
import { TopPagesChart } from '@/components/analytics/TopPagesChart';
import { EventsPieChart } from '@/components/analytics/EventsPieChart';
import { ConversionRateChart } from '@/components/analytics/ConversionRateChart';
import { HourlyHeatmap } from '@/components/analytics/HourlyHeatmap';
import { TopReferrersChart } from '@/components/analytics/TopReferrersChart';
import { EmptyState } from '@/components/client-portal/EmptyState';

interface OverviewTabProps {
  analytics: any;
}

export const OverviewTab = ({ analytics }: OverviewTabProps) => {
  if (!analytics || !analytics.dailyStats) {
    return <EmptyState title="Nenhum dado disponível" description="Aguardando dados de análise..." />;
  }
  // Prepare data for EventsPieChart
  const pieData = [
    { name: 'WhatsApp', value: analytics.conversionsByType?.whatsapp_click || 0 },
    { name: 'Telefone', value: analytics.conversionsByType?.phone_click || 0 },
    { name: 'Email', value: analytics.conversionsByType?.email_click || 0 },
    { name: 'Formulário', value: analytics.conversionsByType?.form_submit || 0 },
  ].filter(item => item.value > 0);

  // Prepare data for TopPagesChart
  const topPagesData = analytics.topPages?.map((p: any) => ({
    page: p.path,
    count: p.conversions,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Linha 1: Gráfico Principal + Card Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimelineChart 
            data={analytics.dailyStats || []}
            isLoading={false}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de Conversões</p>
              <p className="text-3xl font-bold">{analytics.totalConversions || 0}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Total de Visualizações</p>
              <p className="text-3xl font-bold">{(analytics.pageViews || 0).toLocaleString()}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-3xl font-bold">{(analytics.conversionRate || 0).toFixed(2)}%</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
              <p className="text-3xl font-bold">{analytics.uniqueVisitors || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Linha 2: Grid 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topPagesData.length > 0 && (
          <TopPagesChart data={topPagesData} isLoading={false} />
        )}
        {pieData.length > 0 && (
          <EventsPieChart data={pieData} isLoading={false} />
        )}
      </div>
      
      {/* Linha 3: Grid 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConversionRateChart data={analytics.dailyStats || []} isLoading={false} />
        <HourlyHeatmap data={analytics.hourlyStats || []} isLoading={false} />
        {analytics.topReferrers && analytics.topReferrers.length > 0 && (
          <TopReferrersChart data={analytics.topReferrers} isLoading={false} />
        )}
      </div>
    </div>
  );
};

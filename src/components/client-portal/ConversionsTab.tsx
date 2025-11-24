import { Card, CardContent } from '@/components/ui/card';
import { ConversionsTimelineChart } from '@/components/analytics/ConversionsTimelineChart';
import { TopConversionPagesChart } from '@/components/analytics/TopConversionPagesChart';
import { ConversionTypeDistributionChart } from '@/components/analytics/ConversionTypeDistributionChart';
import { ConversionHeatmapChart } from '@/components/analytics/ConversionHeatmapChart';
import { ConversionsTable } from '@/components/analytics/ConversionsTable';
import { EmptyState } from '@/components/client-portal/EmptyState';
import { filterConversions } from '@/lib/conversionUtils';

interface ConversionsTabProps {
  analytics: any;
  siteIds: string[];
}

export const ConversionsTab = ({ analytics, siteIds }: ConversionsTabProps) => {
  if (!analytics || !analytics.conversionsByDay) {
    return <EmptyState title="Nenhuma conversão ainda" description="Aguardando as primeiras conversões..." icon="trend" />;
  }
  // Prepare data for timeline
  const timelineData = (analytics.conversionsByDay || []).map((day: any) => ({
    date: day.date,
    whatsapp: day.whatsapp_click || 0,
    phone: day.phone_click || 0,
    email: day.email_click || 0,
    form: day.form_submit || 0,
  }));

  // Prepare data for top conversion pages
  const topConversionPagesData = (analytics.topConversionPages || []).map((p: any) => ({
    page: p.path,
    conversions: p.conversions,
  }));

  // Prepare data for distribution chart
  const totalConversions = analytics.totalConversions || 1;
  const distributionData = [
    { name: 'WhatsApp', value: analytics.conversionsByType?.whatsapp_click || 0, percentage: '0' },
    { name: 'Telefone', value: analytics.conversionsByType?.phone_click || 0, percentage: '0' },
    { name: 'Email', value: analytics.conversionsByType?.email_click || 0, percentage: '0' },
    { name: 'Formulário', value: analytics.conversionsByType?.form_submit || 0, percentage: '0' },
  ]
    .map(item => ({
      ...item,
      percentage: ((item.value / totalConversions) * 100).toFixed(1)
    }))
    .filter(item => item.value > 0);

  // Filter conversions only
  const conversionsOnly = filterConversions(analytics.conversions || []);

  return (
    <div className="space-y-10">
      {/* Linha 1: Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{analytics.totalConversions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">WhatsApp</p>
            <p className="text-2xl font-bold">{analytics.conversionsByType?.whatsapp_click || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">Telefone</p>
            <p className="text-2xl font-bold">{analytics.conversionsByType?.phone_click || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-2xl font-bold">{analytics.conversionsByType?.email_click || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-10">
            <p className="text-sm text-muted-foreground">Formulário</p>
            <p className="text-2xl font-bold">{analytics.conversionsByType?.form_submit || 0}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Linha 2: Gráfico de Timeline */}
      {timelineData.length > 0 && (
        <ConversionsTimelineChart data={timelineData} isLoading={false} />
      )}
      
      {/* Linha 3: Grid 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {topConversionPagesData.length > 0 && (
          <TopConversionPagesChart data={topConversionPagesData} isLoading={false} />
        )}
        {distributionData.length > 0 && (
          <ConversionTypeDistributionChart data={distributionData} isLoading={false} />
        )}
      </div>
      
      {/* Linha 4: Heatmap */}
      {analytics.hourlyStats && analytics.hourlyStats.length > 0 && (
        <ConversionHeatmapChart 
          data={analytics.hourlyStats.reduce((acc: any, stat: any) => {
            const key = `${stat.dayOfWeek}-${stat.hour}`;
            acc[key] = stat.count;
            return acc;
          }, {})}
          isLoading={false}
        />
      )}
      
      {/* Linha 5: Tabela Detalhada */}
      {conversionsOnly.length > 0 && (
        <ConversionsTable 
          conversions={conversionsOnly}
          isLoading={false}
          siteId={siteIds[0] || ''}
        />
      )}
    </div>
  );
};

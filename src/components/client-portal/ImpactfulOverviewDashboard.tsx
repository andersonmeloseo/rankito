import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, ExternalLink, Award } from 'lucide-react';
import { AreaChartWithGradient } from './charts/AreaChartWithGradient';
import { Progress } from '@/components/ui/progress';

interface PageMetric {
  page_path: string;
  page_title?: string;
  conversions: number;
  pageViews: number;
  conversionRate: number;
}

interface DailyStat {
  date: string;
  conversions: number;
  pageViews: number;
}

interface ImpactfulOverviewDashboardProps {
  dailyStats: DailyStat[];
  topPages: PageMetric[];
  totalConversions: number;
  totalPageViews: number;
  onViewAllPages?: () => void;
}

export const ImpactfulOverviewDashboard = ({
  dailyStats,
  topPages,
  totalConversions,
  totalPageViews,
  onViewAllPages,
}: ImpactfulOverviewDashboardProps) => {
  const top5Pages = topPages.slice(0, 5);
  const maxConversions = Math.max(...top5Pages.map(p => p.conversions), 1);

  const insights = [
    totalConversions > 100 ? `🎯 Excelente! Já são ${totalConversions} conversões` : '📈 Continue assim, as conversões estão crescendo',
    top5Pages[0]?.conversionRate > 5 ? `🏆 ${top5Pages[0].page_path} está com taxa de ${top5Pages[0].conversionRate.toFixed(1)}%` : '',
    totalPageViews > 1000 ? `👀 ${totalPageViews.toLocaleString()} visualizações no período` : '',
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Gráfico Principal */}
      <AreaChartWithGradient data={dailyStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Páginas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Top 5 Páginas Convertendo
            </CardTitle>
            {onViewAllPages && (
              <Button variant="ghost" size="sm" onClick={onViewAllPages}>
                Ver todas
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {top5Pages.map((page, index) => (
              <div key={page.page_path} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant={index === 0 ? 'default' : 'secondary'} className="shrink-0">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{page.page_title || page.page_path}</p>
                      <p className="text-xs text-muted-foreground truncate">{page.page_path}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-2xl font-bold text-primary">{page.conversions}</p>
                    <p className="text-xs text-muted-foreground">{page.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
                <Progress value={(page.conversions / maxConversions) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Insights Automáticos */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Insights do Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border/50">
                <span className="text-2xl">{insight.split(' ')[0]}</span>
                <p className="text-sm flex-1">{insight.substring(insight.indexOf(' ') + 1)}</p>
              </div>
            ))}
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="text-center p-4 bg-card rounded-lg">
                <p className="text-3xl font-bold text-primary">{totalConversions}</p>
                <p className="text-xs text-muted-foreground mt-1">Total de Conversões</p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg">
                <p className="text-3xl font-bold text-accent">{totalPageViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Total de Visualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

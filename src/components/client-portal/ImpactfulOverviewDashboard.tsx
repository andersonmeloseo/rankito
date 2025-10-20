import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, ExternalLink, Award, Target, Zap, BarChart3 } from 'lucide-react';
import { ModernAreaChart } from './charts/ModernAreaChart';
import { ConversionFunnelChart } from './charts/ConversionFunnelChart';
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
    <div className="space-y-8">
      {/* Gráfico Principal Moderno */}
      <ModernAreaChart data={dailyStats} title="Performance de Conversões ao Longo do Tempo" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Páginas - Ocupando 2 colunas */}
        <Card className="lg:col-span-2 backdrop-blur-xl bg-card/80 border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-chart-3 to-chart-4">
                <Award className="h-6 w-6 text-white" />
              </div>
              <span>Top 5 Páginas Convertendo</span>
            </CardTitle>
            {onViewAllPages && (
              <Button variant="ghost" size="sm" onClick={onViewAllPages} className="hover:bg-primary/10">
                Ver todas
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {top5Pages.map((page, index) => (
              <div key={page.page_path} className="space-y-3 animate-slide-right" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge 
                      variant={index === 0 ? 'default' : 'secondary'} 
                      className={`shrink-0 text-base font-bold ${index === 0 ? 'bg-gradient-to-r from-chart-1 to-chart-2 text-white shadow-lg' : ''}`}
                    >
                      #{index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-base">{page.page_title || page.page_path}</p>
                      <p className="text-xs text-muted-foreground truncate">{page.page_path}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-3xl font-bold bg-gradient-to-r from-chart-1 to-chart-3 bg-clip-text text-transparent">
                      {page.conversions}
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold">{page.conversionRate.toFixed(1)}% taxa</p>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={(page.conversions / maxConversions) * 100} 
                    className="h-3 bg-muted/30"
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                    style={{ animationDelay: `${index * 200}ms` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Funil de Conversão */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <ConversionFunnelChart 
            totalViews={totalPageViews}
            totalInteractions={Math.floor(totalPageViews * 0.3)}
            totalConversions={totalConversions}
          />
        </div>
      </div>

      {/* Insights e Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Insights Automáticos */}
        <Card className="md:col-span-2 backdrop-blur-xl bg-gradient-to-br from-chart-1/5 via-card to-chart-2/5 border-border/50 shadow-xl animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-chart-1 to-chart-5">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span>Insights Inteligentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 p-5 bg-card/80 backdrop-blur rounded-xl border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-scale-bounce"
                style={{ animationDelay: `${(index + 1) * 150}ms` }}
              >
                <span className="text-3xl animate-pulse-strong">{insight.split(' ')[0]}</span>
                <p className="text-sm font-medium flex-1 leading-relaxed">
                  {insight.substring(insight.indexOf(' ') + 1)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cards de Métricas Principais */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <Card className="backdrop-blur-xl bg-gradient-to-br from-chart-1/10 to-card border-chart-1/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="pt-6 text-center">
              <Target className="h-10 w-10 mx-auto mb-3 text-chart-1" />
              <p className="text-5xl font-bold bg-gradient-to-r from-chart-1 to-chart-5 bg-clip-text text-transparent mb-2">
                {totalConversions}
              </p>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total de Conversões
              </p>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-xl bg-gradient-to-br from-chart-2/10 to-card border-chart-2/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-chart-2" />
              <p className="text-5xl font-bold bg-gradient-to-r from-chart-2 to-chart-3 bg-clip-text text-transparent mb-2">
                {totalPageViews.toLocaleString()}
              </p>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total de Visualizações
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

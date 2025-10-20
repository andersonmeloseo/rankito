import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, FileText, MousePointerClick, Eye, TrendingUp, DollarSign } from 'lucide-react';
import { Sparkline } from '@/components/analytics/Sparkline';

interface LiveMetrics {
  rate: number;
  timeAgo: string;
  trendDirection: 'up' | 'down';
}

interface MetricsCardsProps {
  monitoredPages: number;
  activePages: number;
  totalConversions: number;
  totalPageViews: number;
  conversionRate: number;
  monthlyRevenue: number;
  liveMetrics?: LiveMetrics;
  sparklineData?: number[];
}

export const AnalyticsMetricsCards = ({
  monitoredPages,
  activePages,
  totalConversions,
  totalPageViews,
  conversionRate,
  monthlyRevenue,
  liveMetrics,
  sparklineData = [],
}: MetricsCardsProps) => {
  const getTrendIcon = () => {
    if (!liveMetrics) return null;
    return liveMetrics.trendDirection === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
    );
  };

  const metrics = [
    {
      title: "Páginas Monitoradas",
      value: monitoredPages,
      icon: Globe,
      color: "text-primary",
      context: `${activePages} ativas`
    },
    {
      title: "Páginas Ativas",
      value: activePages,
      icon: FileText,
      color: "text-accent",
      context: "Com tráfego"
    },
    {
      title: "Conversões",
      value: totalConversions,
      icon: MousePointerClick,
      color: "text-primary",
      showLive: true,
      context: `Taxa: ${conversionRate.toFixed(2)}%`
    },
    {
      title: "Visualizações",
      value: totalPageViews.toLocaleString(),
      icon: Eye,
      color: "text-accent",
      context: "Total"
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-green-500",
      context: "Performance"
    },
    {
      title: "Receita Mensal",
      value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-600",
      context: totalConversions > 0 ? `R$ ${(monthlyRevenue / totalConversions).toFixed(2)}/conv` : ""
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => (
        <Card key={metric.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
              {metric.showLive && liveMetrics && liveMetrics.rate > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  LIVE +{liveMetrics.rate}
                </Badge>
              )}
            </CardTitle>
            <metric.icon className={`h-5 w-5 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{metric.value}</div>
            {metric.context && (
              <p className="text-xs text-muted-foreground">{metric.context}</p>
            )}
            {metric.showLive && liveMetrics && (
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                {getTrendIcon()}
                <span className="ml-1">{liveMetrics.timeAgo}</span>
              </div>
            )}
            {sparklineData.length > 0 && index < 2 && (
              <div className="mt-3">
                <Sparkline data={sparklineData} color={metric.color.replace('text-', '')} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

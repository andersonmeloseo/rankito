import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, FileText, TrendingUp, DollarSign, Target, Activity, CreditCard, ArrowUp, ArrowDown } from 'lucide-react';
import { useClientFinancials } from '@/hooks/useClientFinancials';
import { cn } from '@/lib/utils';

interface LiveMetrics {
  totalConversions: number;
  conversionRate: number;
  conversionsPerHour: number;
  trendDirection: 'up' | 'down' | 'stable';
  lastConversionTime: string | null;
}

interface MetricsCardsProps {
  totalSites: number;
  totalPages: number;
  totalConversions: number;
  conversionRate: number;
  monthlyRevenue: number;
  pageViews: number;
  clientId?: string | null;
  liveMetrics?: LiveMetrics;
}

export const AnalyticsMetricsCards = ({
  totalSites,
  totalPages,
  totalConversions,
  conversionRate,
  monthlyRevenue,
  pageViews,
  clientId,
  liveMetrics,
}: MetricsCardsProps) => {
  const { data: financialData } = useClientFinancials(clientId || null, 90);
  
  const totalDue = (financialData?.summary.totalPending || 0) + (financialData?.summary.totalOverdue || 0);
  const overdueCount = financialData?.summary.overdueCount || 0;

  const metrics = [
    {
      title: "Sites Contratados",
      value: totalSites,
      icon: Globe,
      color: "text-blue-600",
    },
    {
      title: "Páginas Ativas",
      value: totalPages,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Conversões (30d)",
      value: totalConversions,
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Visualizações",
      value: pageViews,
      icon: Activity,
      color: "text-orange-600",
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-indigo-600",
    },
    {
      title: "Valor Mensal",
      value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Saldo Devedor",
      value: `R$ ${totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      color: overdueCount > 0 ? "text-red-600" : "text-green-600",
      subtitle: overdueCount > 0 ? `${overdueCount} em atraso` : "Em dia",
    },
  ];

  const getTrendIcon = () => {
    if (!liveMetrics) return null;
    
    if (liveMetrics.trendDirection === 'up') {
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    } else if (liveMetrics.trendDirection === 'down') {
      return <ArrowDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isConversionMetric = metric.title === "Conversões (30d)" || metric.title === "Taxa de Conversão";
        const showLiveBadge = isConversionMetric && liveMetrics;
        
        return (
          <Card 
            key={index} 
            className={cn(
              "animate-fade-in transition-all",
              showLiveBadge && "border-green-500/50 bg-gradient-to-br from-card to-green-50/30"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                {showLiveBadge && (
                  <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                    LIVE
                  </Badge>
                )}
              </div>
              <Icon className={`w-5 h-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{metric.value}</div>
                {isConversionMetric && getTrendIcon()}
              </div>
              {'subtitle' in metric && metric.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
              )}
              {metric.title === "Conversões (30d)" && liveMetrics && liveMetrics.conversionsPerHour > 0 && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  +{liveMetrics.conversionsPerHour}/h agora
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

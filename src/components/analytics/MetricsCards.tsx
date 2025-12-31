import { Card, CardContent } from "@/components/ui/card";
import { Users, Eye, MousePointerClick, TrendingUp, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { Sparkline } from "./Sparkline";
import { SkeletonMetricCards } from "@/components/ui/skeleton-modern";

interface MetricsCardsProps {
  metrics: any;
  previousMetrics?: any;
  sparklineData?: { pageViews: number[]; conversions: number[] };
  isLoading: boolean;
}

export const MetricsCards = ({ metrics, previousMetrics, sparklineData, isLoading }: MetricsCardsProps) => {
  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = calculateChange(current, previous);
    if (change === null) return null;
    
    const isPositive = parseFloat(change) > 0;
    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        <span>{Math.abs(parseFloat(change))}%</span>
      </div>
    );
  };

  if (isLoading) {
    return <SkeletonMetricCards count={5} />;
  }

  const cards = [
    {
      title: "Visitantes Únicos",
      value: metrics?.uniqueVisitors?.toLocaleString() || 0,
      previousValue: previousMetrics?.uniqueVisitors || 0,
      currentValue: metrics?.uniqueVisitors || 0,
      description: "Tamanho total da sua audiência",
      icon: Users,
      gradient: "blue",
      sparklineData: sparklineData?.pageViews,
      sparklineColor: "hsl(var(--primary))"
    },
    {
      title: "Páginas Únicas",
      value: metrics?.uniquePages?.toLocaleString() || 0,
      previousValue: previousMetrics?.uniquePages || 0,
      currentValue: metrics?.uniquePages || 0,
      description: "Cobertura do conteúdo do site",
      icon: FileText,
      gradient: "purple",
      sparklineData: sparklineData?.pageViews,
      sparklineColor: "hsl(var(--primary))"
    },
    {
      title: "Visualizações",
      value: metrics?.pageViews?.toLocaleString() || 0,
      previousValue: previousMetrics?.pageViews || 0,
      currentValue: metrics?.pageViews || 0,
      description: "Total de páginas visualizadas",
      icon: Eye,
      gradient: "orange",
      sparklineData: sparklineData?.pageViews,
      sparklineColor: "hsl(var(--primary))"
    },
    {
      title: "Conversões",
      value: metrics?.conversions?.toLocaleString() || 0,
      previousValue: previousMetrics?.conversions || 0,
      currentValue: metrics?.conversions || 0,
      description: "Ações realizadas pelos visitantes",
      icon: MousePointerClick,
      gradient: "green",
      sparklineData: sparklineData?.conversions,
      sparklineColor: "hsl(var(--success))"
    },
    {
      title: "Taxa de Conversão",
      value: `${metrics?.conversionRate || 0}%`,
      previousValue: parseFloat(previousMetrics?.conversionRate || "0"),
      currentValue: parseFloat(metrics?.conversionRate || "0"),
      description: "Eficiência em converter visitas",
      icon: TrendingUp,
      gradient: "green",
      sparklineData: sparklineData?.conversions?.map((c, i) => {
        const pv = sparklineData?.pageViews[i];
        return pv > 0 ? (c / pv * 100) : 0;
      }),
      sparklineColor: "hsl(var(--success))"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title} 
            className="card-modern card-interactive overflow-hidden animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="metric-label">{card.title}</p>
                  <p className="metric-value">{card.value}</p>
                  {previousMetrics && getChangeIndicator(card.currentValue, card.previousValue)}
                  <p className="text-xs text-muted-foreground mt-2">{card.description}</p>
                </div>
                <div className={`icon-container icon-gradient-${card.gradient}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              {card.sparklineData && (
                <div className="h-8 mt-2 opacity-60">
                  <Sparkline data={card.sparklineData} color={card.sparklineColor} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

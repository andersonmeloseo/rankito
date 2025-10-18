import { Card, CardContent } from "@/components/ui/card";
import { Users, Eye, MousePointerClick, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { Sparkline } from "./Sparkline";

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
      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        <span>{Math.abs(parseFloat(change))}%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="shadow-card overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics?.uniqueVisitors?.toLocaleString() || 0}
              </p>
              {previousMetrics && getChangeIndicator(metrics?.uniqueVisitors || 0, previousMetrics?.uniqueVisitors || 0)}
            </div>
            <Users className="w-8 h-8 text-primary opacity-60" />
          </div>
          {sparklineData && (
            <div className="h-8 mt-2 opacity-50">
              <Sparkline data={sparklineData.pageViews} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Visualizações</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics?.pageViews?.toLocaleString() || 0}
              </p>
              {previousMetrics && getChangeIndicator(metrics?.pageViews || 0, previousMetrics?.pageViews || 0)}
            </div>
            <Eye className="w-8 h-8 text-primary opacity-60" />
          </div>
          {sparklineData && (
            <div className="h-8 mt-2 opacity-50">
              <Sparkline data={sparklineData.pageViews} color="hsl(var(--primary))" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Conversões</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics?.conversions?.toLocaleString() || 0}
              </p>
              {previousMetrics && getChangeIndicator(metrics?.conversions || 0, previousMetrics?.conversions || 0)}
            </div>
            <MousePointerClick className="w-8 h-8 text-success opacity-60" />
          </div>
          {sparklineData && (
            <div className="h-8 mt-2 opacity-50">
              <Sparkline data={sparklineData.conversions} color="hsl(var(--success))" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics?.conversionRate || 0}%
              </p>
              {previousMetrics && getChangeIndicator(
                parseFloat(metrics?.conversionRate || "0"), 
                parseFloat(previousMetrics?.conversionRate || "0")
              )}
            </div>
            <TrendingUp className="w-8 h-8 text-success opacity-60" />
          </div>
          {sparklineData && (
            <div className="h-8 mt-2 opacity-50">
              <Sparkline 
                data={sparklineData.conversions.map((c, i) => {
                  const pv = sparklineData.pageViews[i];
                  return pv > 0 ? (c / pv * 100) : 0;
                })} 
                color="hsl(var(--success))" 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

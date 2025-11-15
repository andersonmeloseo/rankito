import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPI {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    percentage: number;
    isPositive: boolean;
  };
  suffix?: string;
}

interface Props {
  kpis: KPI[];
}

export const GSCKPIPanel = ({ kpis }: Props) => {
  const getTrendIcon = (trend?: KPI['trend']) => {
    if (!trend) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (trend.isPositive) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend?: KPI['trend']) => {
    if (!trend) return 'text-muted-foreground';
    return trend.isPositive ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">📊 Métricas Agregadas</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="space-y-2">
            <div className="text-sm text-muted-foreground">{kpi.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {kpi.value}
              </span>
              {kpi.suffix && (
                <span className="text-lg text-muted-foreground">{kpi.suffix}</span>
              )}
            </div>
            {kpi.trend && (
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(kpi.trend)}`}>
                {getTrendIcon(kpi.trend)}
                <span className="font-medium">
                  {kpi.trend.percentage >= 0 ? '+' : ''}{kpi.trend.percentage.toFixed(1)}%
                </span>
                <span className="text-muted-foreground text-xs">vs período anterior</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

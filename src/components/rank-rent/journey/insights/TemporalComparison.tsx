import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface TemporalMetrics {
  sessions: number;
  conversions: number;
  avgDuration: number;
  bounceRate: number;
}

interface TemporalComparisonProps {
  current: TemporalMetrics;
  previous: TemporalMetrics;
}

export const TemporalComparison = ({ current, previous }: TemporalComparisonProps) => {
  const calculateChange = (currentVal: number, previousVal: number) => {
    if (previousVal === 0) return currentVal > 0 ? 100 : 0;
    return ((currentVal - previousVal) / previousVal) * 100;
  };

  const getChangeIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (change < -5) return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 5) return "text-green-600 dark:text-green-400";
    if (change < -5) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const metrics = [
    {
      label: 'Sessões',
      current: current.sessions,
      previous: previous.sessions,
      format: (val: number) => val.toString(),
      change: calculateChange(current.sessions, previous.sessions),
    },
    {
      label: 'Conversões',
      current: current.conversions,
      previous: previous.conversions,
      format: (val: number) => val.toString(),
      change: calculateChange(current.conversions, previous.conversions),
    },
    {
      label: 'Tempo Médio',
      current: current.avgDuration,
      previous: previous.avgDuration,
      format: (val: number) => formatTime(Math.round(val)),
      change: calculateChange(current.avgDuration, previous.avgDuration),
    },
    {
      label: 'Taxa Rejeição',
      current: current.bounceRate,
      previous: previous.bounceRate,
      format: (val: number) => `${val.toFixed(1)}%`,
      change: calculateChange(current.bounceRate, previous.bounceRate),
      inverse: true, // Lower is better
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5" />
          Comparação com Período Anterior
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const displayChange = metric.inverse ? -metric.change : metric.change;
            
            return (
              <div 
                key={index}
                className="p-4 rounded-lg bg-background/80 backdrop-blur-sm border space-y-2"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {metric.label}
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {metric.format(metric.current)}
                  </span>
                  
                  <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(displayChange)}`}>
                    {getChangeIcon(displayChange)}
                    {displayChange > 0 && '+'}
                    {displayChange.toFixed(1)}%
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  vs {metric.format(metric.previous)} anterior
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

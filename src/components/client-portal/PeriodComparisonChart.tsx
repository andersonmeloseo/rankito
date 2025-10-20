import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface PeriodComparisonChartProps {
  currentPeriodData: Array<{ date: string; conversions: number; pageViews: number }>;
  periodDays: number;
}

export const PeriodComparisonChart = ({ currentPeriodData, periodDays }: PeriodComparisonChartProps) => {
  // Calculate current period totals
  const currentConversions = currentPeriodData.reduce((acc, d) => acc + d.conversions, 0);
  const currentPageViews = currentPeriodData.reduce((acc, d) => acc + d.pageViews, 0);
  const currentRate = currentPageViews > 0 ? (currentConversions / currentPageViews) * 100 : 0;

  // Mock previous period data (em produção, seria uma query real)
  const previousConversions = Math.floor(currentConversions * (0.8 + Math.random() * 0.4));
  const previousPageViews = Math.floor(currentPageViews * (0.8 + Math.random() * 0.4));
  const previousRate = previousPageViews > 0 ? (previousConversions / previousPageViews) * 100 : 0;

  // Calculate growth
  const conversionGrowth = previousConversions > 0 
    ? ((currentConversions - previousConversions) / previousConversions) * 100 
    : 0;
  const pageViewGrowth = previousPageViews > 0 
    ? ((currentPageViews - previousPageViews) / previousPageViews) * 100 
    : 0;
  const rateGrowth = currentRate - previousRate;

  const getTrendIcon = (growth: number) => {
    if (growth > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-yellow-600" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 5) return "text-green-600";
    if (growth < -5) return "text-red-600";
    return "text-yellow-600";
  };

  const comparisonData = [
    {
      name: 'Conversões',
      'Período Atual': currentConversions,
      'Período Anterior': previousConversions,
    },
    {
      name: 'Visualizações',
      'Período Atual': currentPageViews,
      'Período Anterior': previousPageViews,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Comparação: Últimos {periodDays} dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Conversões</p>
            <p className="text-2xl font-bold">{currentConversions}</p>
            <div className={`flex items-center gap-1 text-xs ${getTrendColor(conversionGrowth)}`}>
              {getTrendIcon(conversionGrowth)}
              <span className="font-medium">{conversionGrowth > 0 ? '+' : ''}{conversionGrowth.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Visualizações</p>
            <p className="text-2xl font-bold">{currentPageViews}</p>
            <div className={`flex items-center gap-1 text-xs ${getTrendColor(pageViewGrowth)}`}>
              {getTrendIcon(pageViewGrowth)}
              <span className="font-medium">{pageViewGrowth > 0 ? '+' : ''}{pageViewGrowth.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Taxa Conversão</p>
            <p className="text-2xl font-bold">{currentRate.toFixed(1)}%</p>
            <div className={`flex items-center gap-1 text-xs ${getTrendColor(rateGrowth)}`}>
              {getTrendIcon(rateGrowth)}
              <span className="font-medium">{rateGrowth > 0 ? '+' : ''}{rateGrowth.toFixed(1)}pp</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Período Atual" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Período Anterior" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

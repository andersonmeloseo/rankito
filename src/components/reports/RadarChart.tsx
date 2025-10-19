import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

interface RadarDataPoint {
  metric: string;
  value: number;
  fullMark: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  isLoading?: boolean;
}

export const RadarChart = ({ data, isLoading }: RadarChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Análise Multidimensional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.metric}</p>
          <p className="text-xs">
            Valor: <span className="font-bold">{data.value.toFixed(1)}</span> / {data.fullMark}
          </p>
          <p className="text-xs text-muted-foreground">
            {((data.value / data.fullMark) * 100).toFixed(0)}% do máximo
          </p>
        </div>
      );
    }
    return null;
  };

  // Calcula pontuação geral
  const overallScore = data.reduce((sum, item) => 
    sum + (item.value / item.fullMark) * 100, 0
  ) / data.length;

  const getScoreStatus = (score: number) => {
    if (score >= 75) return { text: "Excelente", color: "text-green-600" };
    if (score >= 50) return { text: "Bom", color: "text-yellow-600" };
    if (score >= 25) return { text: "Regular", color: "text-orange-600" };
    return { text: "Precisa Melhorar", color: "text-red-600" };
  };

  const status = getScoreStatus(overallScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Análise Multidimensional de Performance</CardTitle>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Score Geral:</span>
          <span className={`font-bold ${status.color}`}>
            {overallScore.toFixed(1)}% - {status.text}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsRadar data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.6}
            />
            <Tooltip content={<CustomTooltip />} />
          </RechartsRadar>
        </ResponsiveContainer>

        {/* Métricas detalhadas */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm font-semibold mb-3">📊 Detalhamento por Métrica:</p>
          <div className="grid grid-cols-2 gap-3">
            {data.map((item, index) => {
              const percentage = (item.value / item.fullMark) * 100;
              const itemStatus = getScoreStatus(percentage);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{item.metric}</span>
                    <span className={itemStatus.color}>{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <p className="text-sm font-semibold">💡 Insights:</p>
          {data.filter(d => (d.value / d.fullMark) < 0.5).map((item, idx) => (
            <p key={idx} className="text-xs text-muted-foreground">
              • {item.metric}: Abaixo de 50% - Oportunidade de melhoria
            </p>
          ))}
          {data.every(d => (d.value / d.fullMark) >= 0.75) && (
            <p className="text-xs text-green-600 font-medium">
              ✨ Excelente! Todas as métricas acima de 75%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

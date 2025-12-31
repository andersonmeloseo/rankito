import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { SkeletonChart } from "@/components/ui/skeleton-modern";
import { IllustratedEmptyState } from "@/components/ui/illustrated-empty-state";

interface ConversionRateChartProps {
  data: { date: string; rate: number }[];
  isLoading: boolean;
}

export const ConversionRateChart = ({ data, isLoading }: ConversionRateChartProps) => {
  if (isLoading) {
    return (
      <Card className="card-modern animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Taxa de Conversão ao Longo do Tempo
          </CardTitle>
          <CardDescription>Acompanhe a evolução da taxa de conversão</CardDescription>
        </CardHeader>
        <CardContent>
          <SkeletonChart height={300} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="card-modern animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Taxa de Conversão ao Longo do Tempo
          </CardTitle>
          <CardDescription>Acompanhe a evolução da taxa de conversão</CardDescription>
        </CardHeader>
        <CardContent>
          <IllustratedEmptyState
            illustration="analytics"
            title="Dados insuficientes"
            description="Não há dados suficientes para calcular a taxa de conversão"
          />
        </CardContent>
      </Card>
    );
  }

  const averageRate = data.reduce((sum, item) => sum + item.rate, 0) / data.length;

  return (
    <Card className="card-modern card-interactive animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Taxa de Conversão ao Longo do Tempo
        </CardTitle>
        <CardDescription>
          Média do período: <span className="font-bold text-primary">{averageRate.toFixed(2)}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="conversionRateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="date"
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(8px)',
              }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Taxa de Conversão']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString("pt-BR");
              }}
            />
            <ReferenceLine
              y={averageRate}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{
                value: `Média: ${averageRate.toFixed(2)}%`,
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#conversionRateGradient)"
              dot={{
                fill: 'hsl(var(--primary))',
                strokeWidth: 2,
                r: 4,
                stroke: 'hsl(var(--card))',
              }}
              activeDot={{
                r: 6,
                fill: 'hsl(var(--primary))',
                stroke: 'hsl(var(--card))',
                strokeWidth: 2,
              }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

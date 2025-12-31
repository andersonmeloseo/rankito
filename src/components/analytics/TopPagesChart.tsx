import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { SkeletonChart } from "@/components/ui/skeleton-modern";
import { IllustratedEmptyState } from "@/components/ui/illustrated-empty-state";

interface TopPagesChartProps {
  data: any[];
  isLoading: boolean;
}

export const TopPagesChart = ({ data, isLoading }: TopPagesChartProps) => {
  if (isLoading) {
    return (
      <Card className="card-modern animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Top 10 Páginas Mais Visitadas
          </CardTitle>
          <CardDescription>Páginas com maior número de eventos</CardDescription>
        </CardHeader>
        <CardContent>
          <SkeletonChart height={400} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="card-modern animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Top 10 Páginas Mais Visitadas
          </CardTitle>
          <CardDescription>Páginas com maior número de eventos</CardDescription>
        </CardHeader>
        <CardContent>
          <IllustratedEmptyState
            illustration="analytics"
            title="Nenhuma página com tráfego"
            description="Não há páginas visitadas no período selecionado"
          />
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(item => item.count));
  const getBarColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity > 0.7) return "hsl(var(--primary))";
    if (intensity > 0.4) return "hsl(var(--success))";
    return "hsl(39, 100%, 57%)";
  };

  return (
    <Card className="card-modern card-interactive animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Top 10 Páginas Mais Visitadas
        </CardTitle>
        <CardDescription>
          Ranking de páginas por volume de eventos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis 
              type="number" 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              dataKey="page" 
              type="category" 
              width={220}
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => value.length > 32 ? value.substring(0, 32) + '...' : value}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(8px)',
              }}
              formatter={(value: number, name: string, props: any) => [
                <>
                  <div><strong>{value}</strong> eventos</div>
                  <div className="text-xs text-muted-foreground mt-1">{props.payload.page}</div>
                </>,
                ""
              ]}
              labelFormatter={() => ""}
            />
            <Bar 
              dataKey="count" 
              radius={[0, 8, 8, 0]}
              name="Eventos"
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.count)}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

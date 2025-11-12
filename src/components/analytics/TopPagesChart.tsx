import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TopPagesChartProps {
  data: any[];
  isLoading: boolean;
}

export const TopPagesChart = ({ data, isLoading }: TopPagesChartProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/50 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Top 10 Páginas Mais Visitadas
          </CardTitle>
          <CardDescription>Páginas com maior número de eventos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg border-border/50 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Top 10 Páginas Mais Visitadas
          </CardTitle>
          <CardDescription>Páginas com maior número de eventos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Nenhuma página com tráfego no período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  // Adiciona gradiente de cores baseado na performance
  const maxCount = Math.max(...data.map(item => item.count));
  const getBarColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity > 0.7) return "hsl(var(--primary))";
    if (intensity > 0.4) return "hsl(142, 76%, 36%)"; // verde
    return "hsl(39, 100%, 57%)"; // laranja
  };

  return (
    <Card className="shadow-lg border-border/50 animate-fade-in hover:shadow-xl transition-all">
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
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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

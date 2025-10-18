import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface PageViewsTimelineChartProps {
  data: { date: string; current: number; previous: number }[];
  isLoading: boolean;
}

export const PageViewsTimelineChart = ({ data, isLoading }: PageViewsTimelineChartProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle>Timeline de Visualizações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle>Timeline de Visualizações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados suficientes para exibir o gráfico
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCurrent = data.reduce((sum, d) => sum + d.current, 0);
  const totalPrevious = data.reduce((sum, d) => sum + d.previous, 0);
  const percentChange = totalPrevious > 0 
    ? ((totalCurrent - totalPrevious) / totalPrevious * 100).toFixed(1)
    : "0";
  const isPositive = parseFloat(percentChange) >= 0;

  return (
    <Card className="shadow-lg border-border/50 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Timeline de Visualizações</CardTitle>
            <CardDescription>Comparação com período anterior</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{percentChange}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#CBD5E1" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="previous" 
              stroke="#94A3B8" 
              strokeWidth={2}
              fill="url(#colorPrevious)" 
              name="Período Anterior"
              animationDuration={1000}
            />
            <Area 
              type="monotone" 
              dataKey="current" 
              stroke="#3B82F6" 
              strokeWidth={3}
              fill="url(#colorCurrent)" 
              name="Período Atual"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
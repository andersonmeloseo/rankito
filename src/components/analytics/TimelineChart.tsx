import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SkeletonChart } from "@/components/ui/skeleton-modern";
import { IllustratedEmptyState } from "@/components/ui/illustrated-empty-state";

interface TimelineChartProps {
  data: any[];
  isLoading: boolean;
}

export const TimelineChart = ({ data, isLoading }: TimelineChartProps) => {
  if (isLoading) {
    return (
      <Card className="card-modern animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Linha do Tempo
          </CardTitle>
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
            📊 Linha do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IllustratedEmptyState
            illustration="analytics"
            title="Nenhum dado disponível"
            description="Não há dados para o período selecionado"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern card-interactive animate-scale-in">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2">
          📊 Linha do Tempo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={450}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                <stop offset="50%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(8px)',
              }}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString("pt-BR");
              }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            <Area
              type="monotone"
              dataKey="pageViews"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPageViews)"
              name="Visualizações"
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
            <Area
              type="monotone"
              dataKey="conversions"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorConversions)"
              name="Conversões"
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useMemo } from "react";

interface EventsPieChartProps {
  data: any[];
  isLoading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

export const EventsPieChart = ({ data, isLoading }: EventsPieChartProps) => {
  const totalEvents = useMemo(() => {
    return data?.reduce((sum, item) => sum + item.value, 0) || 0;
  }, [data]);

  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/50 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Distribuição de Eventos
          </CardTitle>
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
            🎯 Distribuição de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Nenhum evento registrado no período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50 animate-fade-in hover:shadow-xl transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Distribuição de Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={80}
              outerRadius={130}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-3xl font-bold"
              fill="hsl(var(--foreground))"
            >
              {totalEvents.toLocaleString()}
            </text>
            <text
              x="50%"
              y="56%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm"
              fill="hsl(var(--muted-foreground))"
            >
              Total de Eventos
            </text>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

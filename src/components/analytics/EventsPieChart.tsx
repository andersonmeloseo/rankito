import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useMemo } from "react";
import { SkeletonChart } from "@/components/ui/skeleton-modern";
import { IllustratedEmptyState } from "@/components/ui/illustrated-empty-state";

interface EventsPieChartProps {
  data: any[];
  isLoading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(39, 100%, 57%)',
  'hsl(0, 84%, 60%)',
  'hsl(262, 83%, 58%)',
];

export const EventsPieChart = ({ data, isLoading }: EventsPieChartProps) => {
  const totalEvents = useMemo(() => {
    return data?.reduce((sum, item) => sum + item.value, 0) || 0;
  }, [data]);

  if (isLoading) {
    return (
      <Card className="card-modern card-glass animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Distribuição de Eventos
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
      <Card className="card-modern card-glass animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Distribuição de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IllustratedEmptyState
            illustration="analytics"
            title="Nenhum evento registrado"
            description="Não há eventos no período selecionado"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern card-glass card-interactive animate-scale-in">
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
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(8px)',
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

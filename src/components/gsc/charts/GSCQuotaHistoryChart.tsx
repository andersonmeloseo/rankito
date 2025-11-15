import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from "lucide-react";

interface Props {
  data: Array<{
    date: string;
    used: number;
    limit: number;
    available?: number;
  }>;
  isLoading?: boolean;
  todayUsage?: { used: number; limit: number; percentage: number };
  avgUsage?: { used: number; limit: number; percentage: number };
}

export const GSCQuotaHistoryChart = ({ data, isLoading, todayUsage, avgUsage }: Props) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[250px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    available: d.limit - d.used,
  }));

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Histórico de Quota</h3>
        <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
          {todayUsage && (
            <span>
              Hoje: <span className="font-medium text-foreground">
                {todayUsage.used}/{todayUsage.limit} ({todayUsage.percentage.toFixed(1)}%)
              </span>
            </span>
          )}
          {avgUsage && (
            <span>
              Média: <span className="font-medium text-foreground">
                {avgUsage.used}/{avgUsage.limit} ({avgUsage.percentage.toFixed(1)}%)
              </span>
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar 
            dataKey="used" 
            name="Usado" 
            stackId="a" 
            fill="hsl(var(--chart-1))" 
          />
          <Bar 
            dataKey="available" 
            name="Disponível" 
            stackId="a" 
            fill="hsl(var(--muted))" 
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

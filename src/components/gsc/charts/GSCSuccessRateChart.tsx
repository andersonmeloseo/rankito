import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";

interface Props {
  data: Array<{
    hour: string;
    successRate: number;
  }>;
  isLoading?: boolean;
  currentRate?: number;
  avgRate?: number;
}

export const GSCSuccessRateChart = ({ data, isLoading, currentRate, avgRate }: Props) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[250px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const getStrokeColor = (rate: number) => {
    if (rate >= 95) return 'hsl(var(--chart-3))'; // Verde
    if (rate >= 80) return 'hsl(var(--chart-4))'; // Amarelo
    return 'hsl(var(--destructive))'; // Vermelho
  };

  const avgRateValue = avgRate || data.reduce((sum, d) => sum + d.successRate, 0) / data.length;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Taxa de Sucesso</h3>
        <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
          {currentRate !== undefined && (
            <span>
              Atual: <span className={`font-medium ${currentRate >= 95 ? 'text-green-500' : currentRate >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                {currentRate.toFixed(1)}%
              </span>
            </span>
          )}
          <span>
            Média: <span className="font-medium text-foreground">{avgRateValue.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="hour" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Line
            type="monotone"
            dataKey="successRate"
            name="Taxa de Sucesso"
            stroke={getStrokeColor(avgRateValue)}
            strokeWidth={3}
            dot={{ fill: getStrokeColor(avgRateValue), r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

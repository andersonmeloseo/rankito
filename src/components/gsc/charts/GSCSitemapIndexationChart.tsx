import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from "lucide-react";

interface Props {
  data: Array<{
    name: string;
    submitted: number;
    indexed: number;
    rate: number;
  }>;
  isLoading?: boolean;
  totalSitemaps?: number;
  avgRate?: number;
}

export const GSCSitemapIndexationChart = ({ data, isLoading, totalSitemaps, avgRate }: Props) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[250px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const getBarColor = (rate: number) => {
    if (rate >= 90) return 'hsl(var(--chart-3))'; // Verde
    if (rate >= 70) return 'hsl(var(--chart-4))'; // Amarelo
    return 'hsl(var(--destructive))'; // Vermelho
  };

  const avgRateValue = avgRate || data.reduce((sum, d) => sum + d.rate, 0) / (data.length || 1);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Indexação de Sitemaps</h3>
        <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
          {totalSitemaps !== undefined && (
            <span>
              Total: <span className="font-medium text-foreground">{totalSitemaps} sitemaps</span>
            </span>
          )}
          <span>
            Taxa Média: <span className="font-medium text-foreground">{avgRateValue.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            type="number" 
            domain={[0, 100]}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={120}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'rate') return `${value.toFixed(1)}%`;
              return value;
            }}
          />
          <Bar dataKey="rate" name="Taxa de Indexação" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

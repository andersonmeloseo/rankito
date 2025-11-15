import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from "lucide-react";

interface Props {
  data: Array<{
    hour: string;
    google: number;
    indexnow: number;
  }>;
  isLoading?: boolean;
  peak?: { hour: string; count: number };
  avgPerHour?: number;
  total?: number;
}

export const GSCPerformance24hChart = ({ data, isLoading, peak, avgPerHour, total }: Props) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-semibold">📊 Performance de Indexação</h3>
        <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
          {peak && (
            <span>
              Pico: <span className="font-medium text-foreground">{peak.hour}</span> ({peak.count} req/h)
            </span>
          )}
          {avgPerHour !== undefined && (
            <span>
              Média: <span className="font-medium text-foreground">{avgPerHour} req/h</span>
            </span>
          )}
          {total !== undefined && (
            <span>
              Total: <span className="font-medium text-foreground">{total}</span>
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorIndexNow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="hour" 
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
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="google"
            name="Google"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorGoogle)"
          />
          <Area
            type="monotone"
            dataKey="indexnow"
            name="IndexNow"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorIndexNow)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

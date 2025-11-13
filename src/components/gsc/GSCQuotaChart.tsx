import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface QuotaHistoryEntry {
  date: string;
  used: number;
  limit: number;
}

interface GSCQuotaChartProps {
  data?: QuotaHistoryEntry[];
}

export const GSCQuotaChart = ({ data }: GSCQuotaChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Uso de Quota de Indexação (Últimos 7 Dias)</CardTitle>
          <CardDescription>
            Sem dados de quota disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Sem dados de quota disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6">
        <CardHeader>
          <CardTitle>Uso de Quota de Indexação (Últimos 7 Dias)</CardTitle>
          <CardDescription>
            Limite diário agregado: {data && data.length > 0 ? data[0].limit : 200} URLs
          </CardDescription>
        </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => {
                const d = new Date(date);
                return d.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'short' 
                });
              }}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              domain={[0, 'dataMax']} 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const data = payload[0].payload as QuotaHistoryEntry;
                  const date = new Date(data.date);
                  return (
                    <Card className="p-3 shadow-lg border-border">
                      <p className="font-semibold text-sm">
                        {date.toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm mt-1">
                        URLs indexadas: <span className="font-bold">{data.used}/{data.limit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((data.used / data.limit) * 100).toFixed(1)}% da quota
                      </p>
                    </Card>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="used" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorUsed)" 
            />
            <ReferenceLine 
              y={data && data.length > 0 ? data[0].limit : 200} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="5 5" 
              label={{ value: 'Limite', position: 'right', fill: 'hsl(var(--muted-foreground))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

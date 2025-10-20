import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Dot } from 'recharts';

interface ModernAreaChartProps {
  data: Array<{
    date: string;
    conversions: number;
    pageViews: number;
  }>;
  title?: string;
}

export const ModernAreaChart = ({ data, title = 'Performance ao Longo do Tempo' }: ModernAreaChartProps) => {
  const avgConversions = data.reduce((acc, d) => acc + d.conversions, 0) / data.length;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.conversions > avgConversions * 1.5) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={6} 
          fill="hsl(var(--chart-1))" 
          stroke="#fff" 
          strokeWidth={2}
          className="animate-pulse-strong"
        />
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full bg-card border border-border hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorConversionsModern" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorPageViewsModern" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis 
              dataKey="date" 
              className="text-muted-foreground text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-muted-foreground text-xs" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                color: 'hsl(var(--foreground))'
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <ReferenceLine 
              y={avgConversions} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ value: 'Média', position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="conversions"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConversionsModern)"
              name="Conversões"
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(var(--chart-1))' }}
            />
            <Area
              type="monotone"
              dataKey="pageViews"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPageViewsModern)"
              name="Visualizações"
              activeDot={{ r: 4, fill: 'hsl(var(--chart-2))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

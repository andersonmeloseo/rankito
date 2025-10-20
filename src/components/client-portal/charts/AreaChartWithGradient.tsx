import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface AreaChartWithGradientProps {
  data: Array<{
    date: string;
    conversions: number;
    pageViews: number;
  }>;
  title?: string;
}

export const AreaChartWithGradient = ({ data, title = 'Performance de Conversões' }: AreaChartWithGradientProps) => {
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
          className="animate-pulse"
        />
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full backdrop-blur-xl bg-gradient-to-br from-card via-card to-card/50 border-border/50 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-slide-up">
      <CardHeader>
        <CardTitle className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-chart-1 to-chart-2">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent">
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={450}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorConversionsStrong" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.95}/>
                <stop offset="50%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorPageViewsStrong" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                <stop offset="50%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-border/30" 
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              className="text-muted-foreground text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              className="text-muted-foreground text-xs" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '2px solid hsl(var(--border))',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                padding: '16px',
                color: 'hsl(var(--foreground))'
              }}
              labelStyle={{ 
                fontWeight: 'bold', 
                marginBottom: '12px',
                fontSize: '14px',
                color: 'hsl(var(--foreground))'
              }}
              itemStyle={{ 
                padding: '4px 0',
                fontSize: '13px'
              }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '24px',
                fontSize: '14px',
                fontWeight: '500'
              }}
              iconType="circle"
              iconSize={12}
            />
            <ReferenceLine 
              y={avgConversions} 
              stroke="hsl(var(--chart-4))" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: `Média: ${avgConversions.toFixed(0)}`, 
                position: 'insideTopRight', 
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12,
                fontWeight: '600'
              }}
            />
            <Area
              type="monotone"
              dataKey="conversions"
              stroke="hsl(var(--chart-1))"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorConversionsStrong)"
              name="Conversões"
              dot={<CustomDot />}
              activeDot={{ 
                r: 8, 
                fill: 'hsl(var(--chart-1))', 
                stroke: '#fff', 
                strokeWidth: 3,
                filter: 'drop-shadow(0 0 8px hsl(var(--chart-1)))'
              }}
            />
            <Area
              type="monotone"
              dataKey="pageViews"
              stroke="hsl(var(--chart-2))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPageViewsStrong)"
              name="Visualizações"
              activeDot={{ 
                r: 6, 
                fill: 'hsl(var(--chart-2))', 
                stroke: '#fff', 
                strokeWidth: 2 
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

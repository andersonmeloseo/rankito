import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ConversionsVsPageViewsChartProps {
  data: Array<{
    date: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>;
  primaryColor: string;
  secondaryColor: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{payload[0].payload.date}</p>
        <p className="text-sm text-muted-foreground">
          Views: <span className="font-medium text-foreground">{payload[0].value?.toLocaleString()}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Conversões: <span className="font-medium text-foreground">{payload[1]?.value}</span>
        </p>
        <p className="text-sm text-green-600 font-semibold mt-1">
          Taxa: {payload[0].payload.conversionRate.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
};

export const ConversionsVsPageViewsChart = ({ 
  data, 
  primaryColor, 
  secondaryColor 
}: ConversionsVsPageViewsChartProps) => {
  // Find best performing days (top 3 conversion rates)
  const topDays = [...data]
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 3)
    .map(d => d.date);

  return (
    <Card className="shadow-lg border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          📊 Conversões vs Page Views
        </CardTitle>
        <CardDescription>
          Análise de assertividade: correlação entre tráfego e conversões
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: 'Conversões', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: 'Page Views', 
                angle: 90, 
                position: 'insideRight',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* Area de Page Views (fundo) */}
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="views"
              fill="url(#viewsGradient)"
              stroke={secondaryColor}
              strokeWidth={2}
              fillOpacity={1}
              name="Page Views"
            />
            
            {/* Linha de Conversões (destaque) */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="conversions"
              stroke={primaryColor}
              strokeWidth={3}
              dot={(props: any) => {
                const isTopDay = topDays.includes(props.payload.date);
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={isTopDay ? 8 : 5}
                    fill={primaryColor}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              name="Conversões"
              activeDot={{ r: 8, strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Legend for top days */}
        {topDays.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1">
              🔥 Dias com Melhor Assertividade
            </p>
            <div className="flex gap-4 flex-wrap">
              {data
                .filter(d => topDays.includes(d.date))
                .map((day, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-medium">{day.date}:</span>{' '}
                    <span className="text-green-600 font-semibold">
                      {day.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

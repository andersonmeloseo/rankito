import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { MapPin } from "lucide-react";

interface GeoAnalyticsChartProps {
  data: Array<{ location: string; city: string; region: string; count: number }>;
}

export const GeoAnalyticsChart = ({ data }: GeoAnalyticsChartProps) => {
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const chartData = data.slice(0, 8).map((item, index) => ({
    name: item.city !== 'Unknown' ? item.city : item.location,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Top Localidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div key={item.location} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium">{item.city}</span>
                {item.region !== 'Unknown' && (
                  <span className="text-muted-foreground">• {item.region}</span>
                )}
              </div>
              <span className="font-bold">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

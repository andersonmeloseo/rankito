import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Smartphone, Monitor, Tablet } from "lucide-react";

interface DeviceAnalyticsChartProps {
  data: Array<{ device: string; count: number }>;
}

export const DeviceAnalyticsChart = ({ data }: DeviceAnalyticsChartProps) => {
  const COLORS = {
    'Desktop': 'hsl(var(--chart-1))',
    'Mobile': 'hsl(var(--chart-2))',
    'Tablet': 'hsl(var(--chart-3))',
  };

  const getIcon = (device: string) => {
    switch(device) {
      case 'Mobile': return <Smartphone className="h-4 w-4" />;
      case 'Tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const total = data.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Dispositivos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.device as keyof typeof COLORS] || 'hsl(var(--chart-4))'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.device} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(item.device)}
                  <span className="text-sm font-medium">{item.device}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{item.count}</div>
                  <div className="text-xs text-muted-foreground">
                    {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

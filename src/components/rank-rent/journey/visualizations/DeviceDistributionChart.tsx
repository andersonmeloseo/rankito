import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Smartphone, Monitor, Tablet } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface DeviceMetrics {
  device: string;
  sessions: number;
  avgDuration: number;
  conversionRate: number;
}

interface DeviceDistributionChartProps {
  data: DeviceMetrics[];
}

const DEVICE_ICONS = {
  'Mobile': Smartphone,
  'Desktop': Monitor,
  'Tablet': Tablet,
};

const COLORS = {
  'Mobile': '#3b82f6',
  'Desktop': '#10b981',
  'Tablet': '#f59e0b',
};

export const DeviceDistributionChart = ({ data }: DeviceDistributionChartProps) => {
  const totalSessions = data.reduce((acc, d) => acc + d.sessions, 0);
  
  const chartData = data.map(d => ({
    name: d.device,
    value: d.sessions,
    percentage: totalSessions > 0 ? (d.sessions / totalSessions) * 100 : 0,
    ...d
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          Distribuição por Dispositivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background p-3 border rounded-lg shadow-lg">
                        <div className="font-semibold">{data.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.value} sessões ({data.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Cards */}
          <div className="space-y-3">
            {data.map((device) => {
              const Icon = DEVICE_ICONS[device.device as keyof typeof DEVICE_ICONS];
              const percentage = totalSessions > 0 ? (device.sessions / totalSessions) * 100 : 0;
              
              return (
                <div 
                  key={device.device}
                  className="p-3 rounded-lg border bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" style={{ color: COLORS[device.device as keyof typeof COLORS] }} />}
                      <span className="font-semibold">{device.device}</span>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Sessões</div>
                      <div className="font-semibold">{device.sessions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Tempo</div>
                      <div className="font-semibold">{formatTime(Math.round(device.avgDuration))}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conv.</div>
                      <div className="font-semibold">{device.conversionRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

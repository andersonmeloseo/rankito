import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface RegionData {
  region: string;
  country: string;
  conversions: number;
  percentage: number;
}

interface RegionalHeatmapChartProps {
  regions: RegionData[];
}

export const RegionalHeatmapChart = ({ regions }: RegionalHeatmapChartProps) => {
  const top15 = regions.slice(0, 15);
  const maxConversions = Math.max(...top15.map(r => r.conversions), 1);

  const getColor = (conversions: number) => {
    const intensity = conversions / maxConversions;
    if (intensity > 0.7) return '#2563eb'; // Strong blue
    if (intensity > 0.4) return '#3b82f6'; // Medium blue
    if (intensity > 0.2) return '#60a5fa'; // Light blue
    return '#93c5fd'; // Very light blue
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].payload.region}</p>
          <p className="text-sm text-muted-foreground">{payload[0].payload.country}</p>
          <p className="text-sm font-medium mt-1">
            {payload[0].value} conversões ({payload[0].payload.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (regions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor Regional</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor Regional (Top 15)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={top15} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="region" 
              type="category" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
              {top15.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.conversions)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

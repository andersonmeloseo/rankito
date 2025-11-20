import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CountryData {
  country: string;
  country_code: string;
  conversions: number;
  percentage: number;
}

interface CountryDistributionChartProps {
  countries: CountryData[];
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#cbd5e1', '#94a3b8', '#64748b', '#475569'];

export const CountryDistributionChart = ({ countries }: CountryDistributionChartProps) => {
  // Get top 10 countries and group the rest as "Outros"
  const top10 = countries.slice(0, 10);
  const others = countries.slice(10);
  const othersTotal = others.reduce((sum, c) => sum + c.conversions, 0);

  const chartData = [
    ...top10.map(c => ({
      name: c.country,
      value: c.conversions,
      percentage: c.percentage,
    })),
    ...(othersTotal > 0 ? [{
      name: 'Outros',
      value: othersTotal,
      percentage: (othersTotal / countries.reduce((sum, c) => sum + c.conversions, 0)) * 100,
    }] : []),
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} conversões ({payload[0].payload.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (countries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por País</CardTitle>
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
        <CardTitle>Distribuição por País</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

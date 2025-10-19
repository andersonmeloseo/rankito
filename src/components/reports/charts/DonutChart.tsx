import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DonutChartProps {
  data: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const COLORS_MAP: Record<string, string> = {};

export const DonutChart = ({ data, colors }: DonutChartProps) => {
  const chartData = data.map(item => ({
    name: item.type,
    value: item.count,
    percentage: item.percentage,
  }));

  const colorArray = [colors.primary, colors.secondary, colors.accent];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={5}
          dataKey="value"
          label={(entry) => `${entry.percentage.toFixed(1)}%`}
          animationDuration={1500}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colorArray[index % colorArray.length]}
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '8px',
            border: `1px solid ${colors.primary}`,
          }}
          formatter={(value: any, name: any, props: any) => [
            `${value} conversões (${props.payload.percentage.toFixed(1)}%)`,
            name
          ]}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry: any) => `${value} (${entry.payload.value})`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

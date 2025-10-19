import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SmoothLineChartProps {
  data: Array<{
    date: string;
    pageViews: number;
  }>;
  colors: {
    secondary: string;
  };
}

export const SmoothLineChart = ({ data, colors }: SmoothLineChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '8px',
            border: `1px solid ${colors.secondary}`,
          }}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('pt-BR');
          }}
        />
        <Legend />
        <Line 
          type="monotone"
          dataKey="pageViews"
          name="Page Views"
          stroke={colors.secondary}
          strokeWidth={3}
          dot={{ r: 4, fill: colors.secondary }}
          activeDot={{ r: 6 }}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

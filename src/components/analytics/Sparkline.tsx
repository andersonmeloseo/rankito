import { Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

export const Sparkline = ({ data, color = "hsl(var(--primary))" }: SparklineProps) => {
  // Guard clause para dados inválidos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
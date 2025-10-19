import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ModernAreaChartProps {
  data: Array<{
    date: string;
    conversions: number;
  }>;
  colors: {
    primary: string;
    secondary: string;
  };
  gradient?: {
    start: number;
    end: number;
  };
}

export const ModernAreaChart = ({ data, colors, gradient = { start: 0.8, end: 0 } }: ModernAreaChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.primary} stopOpacity={gradient.start} />
            <stop offset="95%" stopColor={colors.primary} stopOpacity={gradient.end} />
          </linearGradient>
        </defs>
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
            border: `1px solid ${colors.primary}`,
          }}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('pt-BR');
          }}
        />
        <Area 
          type="monotone" 
          dataKey="conversions" 
          stroke={colors.primary}
          strokeWidth={3}
          fill="url(#colorConversions)"
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

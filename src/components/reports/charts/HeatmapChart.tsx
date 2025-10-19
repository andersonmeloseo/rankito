import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface HeatmapChartProps {
  data: Array<{
    hour: number;
    dayOfWeek: number;
    conversions: number;
  }>;
  colors: {
    primary: string;
  };
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const HeatmapChart = ({ data, colors }: HeatmapChartProps) => {
  const maxConversions = Math.max(...data.map(d => d.conversions));

  const getColor = (conversions: number) => {
    const intensity = conversions / maxConversions;
    // Convert hex to RGB and apply intensity
    const hex = colors.primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})`;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis 
          type="number" 
          dataKey="hour" 
          name="Hora"
          domain={[0, 23]}
          ticks={[0, 6, 12, 18, 23]}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          type="number" 
          dataKey="dayOfWeek" 
          name="Dia"
          domain={[0, 6]}
          ticks={[0, 1, 2, 3, 4, 5, 6]}
          tickFormatter={(value) => DAYS[value]}
          tick={{ fontSize: 12 }}
        />
        <ZAxis 
          type="number" 
          dataKey="conversions" 
          range={[100, 500]}
        />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border">
                  <p className="font-semibold">{DAYS[data.dayOfWeek]} - {data.hour}h</p>
                  <p className="text-sm">{data.conversions} conversões</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Scatter data={data} shape="circle">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.conversions)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

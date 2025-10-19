import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface WinRateGaugeProps {
  wonDeals: number;
  lostDeals: number;
  winRate: number;
}

export const WinRateGauge = ({ wonDeals, lostDeals, winRate }: WinRateGaugeProps) => {
  const data = [
    { name: 'Ganhos', value: wonDeals, color: '#34d399' },
    { name: 'Perdidos', value: lostDeals, color: '#f87171' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold mb-2">
            {winRate.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mb-4">Win Rate</p>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{payload[0].name}</p>
                        <p className="text-sm">{payload[0].value} deals</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

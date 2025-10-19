import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Deal } from "@/hooks/useDeals";

interface SalesFunnelChartProps {
  deals: Deal[];
  stages: Array<{ stage_key: string; label: string; color: string }>;
}

export const SalesFunnelChart = ({ deals, stages }: SalesFunnelChartProps) => {
  const activeStages = stages.filter(s => !['won', 'lost'].includes(s.stage_key));
  
  const funnelData = activeStages.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage.stage_key);
    return {
      name: stage.label,
      value: stageDeals.length,
      totalValue: stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0),
      color: stage.color,
    };
  });

  const getColorFromBgClass = (colorClass: string) => {
    const colorMap: { [key: string]: string } = {
      'bg-slate-100': 'hsl(var(--muted))',
      'bg-blue-100': 'hsl(var(--primary))',
      'bg-purple-100': 'hsl(var(--accent))',
      'bg-yellow-100': '#fbbf24',
      'bg-green-100': '#34d399',
      'bg-red-100': '#f87171',
    };
    return colorMap[colorClass] || 'hsl(var(--primary))';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-sm"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              className="text-sm"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{payload[0].payload.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {payload[0].value} deals
                      </p>
                      <p className="text-sm font-medium">
                        R$ {payload[0].payload.totalValue.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorFromBgClass(entry.color)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { FinancialMetric } from "@/hooks/useFinancialMetrics";

interface ProfitabilityChartsProps {
  metrics: FinancialMetric[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export const ProfitabilityCharts = ({ metrics }: ProfitabilityChartsProps) => {
  // Top 10 pages by profit
  const topProfitPages = [...metrics]
    .sort((a, b) => Number(b.monthly_profit) - Number(a.monthly_profit))
    .slice(0, 10)
    .map((m) => ({
      name: m.page_title || m.page_path.substring(0, 20),
      lucro: Number(m.monthly_profit),
      receita: Number(m.monthly_revenue),
      custos: Number(m.monthly_conversion_costs) + Number(m.monthly_fixed_costs),
    }));

  // Revenue distribution by client
  const revenueByClient = metrics.reduce((acc, m) => {
    const client = m.client_name || "Sem cliente";
    if (!acc[client]) {
      acc[client] = 0;
    }
    acc[client] += Number(m.monthly_revenue);
    return acc;
  }, {} as Record<string, number>);

  const clientDistribution = Object.entries(revenueByClient).map(([name, value]) => ({
    name,
    value,
  }));

  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Páginas por Lucratividade</CardTitle>
          <CardDescription>Receita, custos e lucro líquido</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProfitPages}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="receita" fill="#3b82f6" name="Receita" />
              <Bar dataKey="custos" fill="#f59e0b" name="Custos" />
              <Bar dataKey="lucro" fill="#10b981" name="Lucro" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Receita por Cliente</CardTitle>
          <CardDescription>Participação percentual na receita total</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={clientDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {clientDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

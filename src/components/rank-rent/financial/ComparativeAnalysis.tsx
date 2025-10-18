import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import type { FinancialMetric } from "@/hooks/useFinancialMetrics";

interface ComparativeAnalysisProps {
  metrics: FinancialMetric[];
}

export const ComparativeAnalysis = ({ metrics }: ComparativeAnalysisProps) => {
  if (metrics.length === 0) {
    return null;
  }

  // Find best and worst performers
  const mostProfitable = [...metrics].sort((a, b) => Number(b.monthly_profit) - Number(a.monthly_profit))[0];
  const leastProfitable = [...metrics].sort((a, b) => Number(a.monthly_profit) - Number(b.monthly_profit))[0];
  const highestROI = [...metrics].sort((a, b) => Number(b.roi_percentage) - Number(a.roi_percentage))[0];
  const lowestROI = [...metrics].sort((a, b) => Number(a.roi_percentage) - Number(b.roi_percentage))[0];

  const avgRentValue = metrics.reduce((sum, m) => sum + Number(m.monthly_revenue), 0) / metrics.length;
  
  // Calculate average ticket per client
  const clientRevenues = metrics.reduce((acc, m) => {
    const client = m.client_name || "Sem cliente";
    if (!acc[client]) {
      acc[client] = 0;
    }
    acc[client] += Number(m.monthly_revenue);
    return acc;
  }, {} as Record<string, number>);
  
  const avgTicketPerClient = Object.values(clientRevenues).reduce((sum, v) => sum + v, 0) / Object.keys(clientRevenues).length;

  const comparisonCards = [
    {
      title: "Página Mais Lucrativa",
      value: mostProfitable.page_title || mostProfitable.page_path,
      subtitle: `R$ ${Number(mostProfitable.monthly_profit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Página Menos Lucrativa",
      value: leastProfitable.page_title || leastProfitable.page_path,
      subtitle: `R$ ${Number(leastProfitable.monthly_profit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Maior ROI",
      value: highestROI.page_title || highestROI.page_path,
      subtitle: `${Number(highestROI.roi_percentage).toFixed(1)}%`,
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Menor ROI",
      value: lowestROI.page_title || lowestROI.page_path,
      subtitle: `${Number(lowestROI.roi_percentage).toFixed(1)}%`,
      icon: Target,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Média de Aluguel por Página",
      value: `R$ ${avgRentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      subtitle: `${metrics.length} páginas alugadas`,
      icon: DollarSign,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Ticket Médio por Cliente",
      value: `R$ ${avgTicketPerClient.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      subtitle: `${Object.keys(clientRevenues).length} clientes ativos`,
      icon: DollarSign,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Análise Comparativa</h3>
        <p className="text-sm text-muted-foreground">
          Comparação de performance entre páginas e clientes
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {comparisonCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium truncate" title={card.value}>
                {card.value}
              </div>
              <p className={`text-xl font-bold ${card.color}`}>{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

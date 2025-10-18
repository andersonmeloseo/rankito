import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, AlertCircle, Globe, BarChart3, TrendingDown } from "lucide-react";
import { GlobalFinancialSummary } from "@/hooks/useGlobalFinancialMetrics";

interface GlobalFinancialOverviewProps {
  summary: GlobalFinancialSummary;
}

export const GlobalFinancialOverview = ({ summary }: GlobalFinancialOverviewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const rentabilityRate = summary.totalSitesWithMetrics > 0 
    ? (summary.profitableSites / summary.totalSitesWithMetrics) * 100 
    : 0;

  const cards = [
    {
      title: "Receita Total Mensal",
      value: formatCurrency(summary.totalRevenue),
      icon: TrendingUp,
      description: "Soma de todos os projetos",
      color: "text-green-600",
    },
    {
      title: "Lucro Líquido Mensal",
      value: formatCurrency(summary.totalProfit),
      icon: summary.totalProfit > 0 ? DollarSign : TrendingDown,
      description: `Margem: ${summary.avgProfitMargin.toFixed(1)}%`,
      color: summary.totalProfit > 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "ROI Médio",
      value: `${summary.avgROI.toFixed(1)}%`,
      icon: TrendingUp,
      description: `${summary.profitableSites} projetos lucrativos`,
      color: summary.avgROI > 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Custos Totais",
      value: formatCurrency(summary.totalCosts),
      icon: AlertCircle,
      description: `${summary.totalConversions} conversões`,
      color: "text-orange-600",
    },
    {
      title: "Projetos Ativos",
      value: summary.totalSitesWithMetrics.toString(),
      icon: Globe,
      description: `${summary.unprofitableSites} precisam atenção`,
      color: "text-blue-600",
    },
    {
      title: "Taxa de Rentabilidade",
      value: `${rentabilityRate.toFixed(0)}%`,
      icon: BarChart3,
      description: `${summary.profitableSites}/${summary.totalSitesWithMetrics} lucrativos`,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`w-5 h-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

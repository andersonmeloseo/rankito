import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Percent, FileBarChart, CheckCircle2 } from "lucide-react";

interface FinancialSummaryCardsProps {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  avgROI: number;
  totalPages: number;
  profitablePages: number;
}

export const FinancialSummaryCards = ({
  totalRevenue,
  totalCosts,
  totalProfit,
  avgROI,
  totalPages,
  profitablePages,
}: FinancialSummaryCardsProps) => {
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const cards = [
    {
      title: "Receita Mensal Total",
      value: `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Soma de todos os aluguéis",
      color: "text-blue-500",
    },
    {
      title: "Custos Mensais",
      value: `R$ ${totalCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      description: "Custos de conversão + fixos",
      color: "text-orange-500",
    },
    {
      title: "Lucro Líquido",
      value: `R$ ${totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      description: "Receita - Custos",
      color: totalProfit >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "ROI Médio",
      value: `${avgROI.toFixed(1)}%`,
      icon: Percent,
      description: "Retorno sobre investimento",
      color: avgROI >= 50 ? "text-green-500" : avgROI >= 0 ? "text-yellow-500" : "text-red-500",
    },
    {
      title: "Margem de Lucro",
      value: `${profitMargin.toFixed(1)}%`,
      icon: FileBarChart,
      description: "Lucro / Receita",
      color: profitMargin >= 30 ? "text-green-500" : profitMargin >= 0 ? "text-yellow-500" : "text-red-500",
    },
    {
      title: "Páginas Lucrativas",
      value: `${profitablePages} / ${totalPages}`,
      icon: CheckCircle2,
      description: "Com lucro positivo",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

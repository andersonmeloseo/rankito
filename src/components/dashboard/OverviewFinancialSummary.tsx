import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PieChart, Percent } from "lucide-react";
import { useGlobalFinancialMetrics } from "@/hooks/useGlobalFinancialMetrics";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewFinancialSummaryProps {
  userId: string;
}

export const OverviewFinancialSummary = ({ userId }: OverviewFinancialSummaryProps) => {
  const { summary, isLoading } = useGlobalFinancialMetrics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const stats = [
    {
      label: "Receita Mensal",
      value: formatCurrency(summary?.totalRevenue || 0),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Custos Totais",
      value: formatCurrency(summary?.totalCosts || 0),
      icon: PieChart,
      color: "text-orange-600",
    },
    {
      label: "Lucro Líquido",
      value: formatCurrency(summary?.totalProfit || 0),
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      label: "ROI Médio",
      value: `${summary?.avgROI?.toFixed(1) || 0}%`,
      icon: Percent,
      color: "text-blue-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                {stat.label}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

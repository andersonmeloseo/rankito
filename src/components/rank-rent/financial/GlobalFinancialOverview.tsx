import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, AlertCircle, Globe, CheckCircle2, Calendar } from "lucide-react";
import { GlobalFinancialSummary } from "@/hooks/useGlobalFinancialMetrics";
import { usePayments } from "@/hooks/usePayments";

interface GlobalFinancialOverviewProps {
  summary: GlobalFinancialSummary;
  userId: string;
}

export const GlobalFinancialOverview = ({ summary, userId }: GlobalFinancialOverviewProps) => {
  const { summary: paymentsSummary } = usePayments(userId);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const sitesAwaitingData = summary.totalSitesWithMetrics - summary.profitableSites - summary.unprofitableSites;

  const cards = [
    {
      title: "Receita Mensal Total",
      value: formatCurrency(summary.totalRevenue),
      icon: TrendingUp,
      description: `${summary.totalSitesWithMetrics} projeto${summary.totalSitesWithMetrics !== 1 ? 's' : ''} ativo${summary.totalSitesWithMetrics !== 1 ? 's' : ''}`,
      color: "text-green-600",
    },
    {
      title: "Pagamentos Recebidos",
      value: formatCurrency(paymentsSummary.totalPaid),
      icon: CheckCircle2,
      description: `${paymentsSummary.paidCount} pagamento${paymentsSummary.paidCount !== 1 ? 's' : ''} confirmado${paymentsSummary.paidCount !== 1 ? 's' : ''}`,
      color: "text-green-600",
    },
    {
      title: "Pagamentos Pendentes",
      value: formatCurrency(paymentsSummary.totalPending),
      icon: Calendar,
      description: `${paymentsSummary.pendingCount} aguardando pagamento`,
      color: "text-yellow-600",
    },
    {
      title: "Pagamentos Atrasados",
      value: formatCurrency(paymentsSummary.totalOverdue),
      icon: AlertCircle,
      description: `${paymentsSummary.overdueCount} pagamento${paymentsSummary.overdueCount !== 1 ? 's' : ''} em atraso`,
      color: "text-red-600",
    },
    {
      title: "Lucro Mensal",
      value: formatCurrency(summary.totalProfit),
      icon: DollarSign,
      description: `ROI médio: ${summary.avgROI.toFixed(1)}%`,
      color: summary.totalProfit >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Projetos Ativos",
      value: summary.totalSitesWithMetrics.toString(),
      icon: Globe,
      description: `${summary.profitableSites} lucrativo${summary.profitableSites !== 1 ? 's' : ''}${sitesAwaitingData > 0 ? `, ${sitesAwaitingData} aguardando dados` : ''}`,
      color: "text-blue-600",
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

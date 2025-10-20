import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, FileText, TrendingUp, DollarSign, Target, Activity, CreditCard } from 'lucide-react';
import { useClientFinancials } from '@/hooks/useClientFinancials';

interface MetricsCardsProps {
  totalSites: number;
  totalPages: number;
  totalConversions: number;
  conversionRate: number;
  monthlyRevenue: number;
  pageViews: number;
  clientId?: string | null;
}

export const AnalyticsMetricsCards = ({
  totalSites,
  totalPages,
  totalConversions,
  conversionRate,
  monthlyRevenue,
  pageViews,
  clientId,
}: MetricsCardsProps) => {
  const { data: financialData } = useClientFinancials(clientId || null, 90);
  
  const totalDue = (financialData?.summary.totalPending || 0) + (financialData?.summary.totalOverdue || 0);
  const overdueCount = financialData?.summary.overdueCount || 0;

  const metrics = [
    {
      title: "Sites Contratados",
      value: totalSites,
      icon: Globe,
      color: "text-blue-600",
    },
    {
      title: "Páginas Ativas",
      value: totalPages,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Conversões (30d)",
      value: totalConversions,
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Visualizações",
      value: pageViews,
      icon: Activity,
      color: "text-orange-600",
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-indigo-600",
    },
    {
      title: "Valor Mensal",
      value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Saldo Devedor",
      value: `R$ ${totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      color: overdueCount > 0 ? "text-red-600" : "text-green-600",
      subtitle: overdueCount > 0 ? `${overdueCount} em atraso` : "Em dia",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className={`w-5 h-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {'subtitle' in metric && metric.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

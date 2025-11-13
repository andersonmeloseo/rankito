import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, TrendingUp, DollarSign, Clock } from "lucide-react";
import { useCRMMetrics } from "@/hooks/useCRMMetrics";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewCRMSummaryProps {
  userId: string;
}

export const OverviewCRMSummary = ({ userId }: OverviewCRMSummaryProps) => {
  const { metrics, isLoading } = useCRMMetrics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Resumo do CRM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Deals Ativos",
      value: metrics?.activeDeals || 0,
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      label: "Taxa de Conversão",
      value: `${metrics?.winRate || 0}%`,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Valor Total",
      value: `R$ ${(metrics?.totalValue || 0).toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      label: "Dias p/ Fechar",
      value: Math.round(metrics?.avgDaysToClose || 0),
      icon: Clock,
      color: "text-orange-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Resumo do CRM
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

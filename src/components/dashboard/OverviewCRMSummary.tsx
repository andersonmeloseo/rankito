import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp, DollarSign, Clock, ArrowRight } from "lucide-react";
import { useCRMMetrics } from "@/hooks/useCRMMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface OverviewCRMSummaryProps {
  userId: string;
}

export const OverviewCRMSummary = ({ userId }: OverviewCRMSummaryProps) => {
  const navigate = useNavigate();
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

  const hasData = metrics && (
    metrics.activeDeals > 0 || 
    metrics.winRate > 0 || 
    metrics.totalValue > 0 || 
    metrics.avgDaysToClose > 0
  );

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Resumo do CRM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum deal ativo
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              Comece a criar deals no CRM para acompanhar seu pipeline de vendas
            </p>
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Resumo do CRM
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/dashboard", { state: { tab: "crm" } })}
            className="gap-2"
          >
            Ver CRM
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="space-y-2 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
              onClick={() => navigate("/dashboard", { state: { tab: "crm" } })}
            >
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

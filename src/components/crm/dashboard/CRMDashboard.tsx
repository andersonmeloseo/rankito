import { useCRMMetrics } from "@/hooks/useCRMMetrics";
import { useDeals } from "@/hooks/useDeals";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { MetricsCard } from "./MetricsCard";
import { SalesFunnelChart } from "./SalesFunnelChart";
import { WinRateGauge } from "./WinRateGauge";
import { ActivityTimeline } from "./ActivityTimeline";
import { UpcomingDeals } from "./UpcomingDeals";
import { EngagementAnalytics } from "./EngagementAnalytics";
import { TrendingUp, Target, DollarSign, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CRMDashboardProps {
  userId: string;
}

export const CRMDashboard = ({ userId }: CRMDashboardProps) => {
  const { metrics, isLoading: metricsLoading } = useCRMMetrics(userId);
  const { deals, isLoading: dealsLoading } = useDeals(userId);
  const { stages, isLoading: stagesLoading } = usePipelineStages(userId);

  const isLoading = metricsLoading || dealsLoading || stagesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!metrics || !deals || !stages) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Deals Ativos"
          value={metrics.activeDeals}
          icon={TrendingUp}
          subtitle={`${metrics.totalDeals} total`}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricsCard
          title="Taxa de Conversão"
          value={`${metrics.winRate}%`}
          icon={Target}
          subtitle={`${metrics.wonDeals} ganhos / ${metrics.wonDeals + metrics.lostDeals} fechados`}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <MetricsCard
          title="Valor Total Ganho"
          value={`R$ ${metrics.totalValue.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          subtitle={`Previsão: R$ ${metrics.forecast.toLocaleString('pt-BR')}`}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <MetricsCard
          title="Tempo Médio de Fechamento"
          value={`${metrics.avgDaysToClose}d`}
          icon={Clock}
          subtitle={`${metrics.dealsClosingSoon} fechando em breve`}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* Overdue Tasks Alert */}
      {metrics.overdueTasks > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm font-medium">
            Você tem {metrics.overdueTasks} tarefa(s) atrasada(s) que precisam de atenção!
          </p>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesFunnelChart deals={deals} stages={stages} />
        <WinRateGauge 
          wonDeals={metrics.wonDeals}
          lostDeals={metrics.lostDeals}
          winRate={metrics.winRate}
        />
      </div>

      {/* Engagement Analytics */}
      <EngagementAnalytics deals={deals} />

      {/* Timeline and Upcoming Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityTimeline userId={userId} />
        <UpcomingDeals deals={deals} />
      </div>
    </div>
  );
};

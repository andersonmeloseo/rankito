import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSaasMetrics } from "@/hooks/useSaasMetrics";
import { useSystemConsumptionMetrics } from "@/hooks/useSystemConsumptionMetrics";
import { DollarSign, TrendingUp, Users, Clock, AlertCircle, TrendingDown, Server, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { SystemConsumptionCard } from "./SystemConsumptionCard";
import { TopUsersConsumptionTable } from "./TopUsersConsumptionTable";
import { ResourceDistributionByPlan } from "./ResourceDistributionByPlan";

export const OverviewDashboard = () => {
  const { data: metrics, isLoading } = useSaasMetrics();
  const { data: consumption, isLoading: isLoadingConsumption } = useSystemConsumptionMetrics();

  if (isLoading) {
    return <div>Carregando métricas...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Alerts Section */}
      <div className="space-y-4">
        {metrics && metrics.pendingPaymentsCount > 0 && (
          <Alert variant="destructive" className="p-4">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              {metrics.pendingPaymentsCount} pagamentos pendentes - Total: {formatCurrency(metrics.pendingAmount)}
            </AlertDescription>
          </Alert>
        )}
        
        {metrics && metrics.trialsExpiringSoon > 0 && (
          <Alert className="p-4">
            <Clock className="h-5 w-5" />
            <AlertDescription className="ml-2">
              {metrics.trialsExpiringSoon} trials expirando nos próximos 7 dias
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Metrics - 2x2 Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">MRR Atual</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.mrr || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly Recurring Revenue
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Crescimento MRR</CardTitle>
            {(metrics?.mrrGrowth || 0) >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(metrics?.mrrGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(metrics?.mrrGrowth || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.activeUsers || 0} / {metrics?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.totalUsers ? ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1) : 0}% da base
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Conversão Trial → Pago</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.conversionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de conversão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics - 2x1 Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Trials Expirando</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.trialsExpiringSoon || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.pendingAmount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.pendingPaymentsCount || 0} pagamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Consumption Analytics */}
      <Separator className="my-8" />
      
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Server className="h-6 w-6" />
          Análise de Consumo do Sistema
        </h2>

        {isLoadingConsumption ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : consumption ? (
          <>
            <SystemConsumptionCard metrics={consumption} />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <TopUsersConsumptionTable topUsers={consumption.topUsers} />
              <ResourceDistributionByPlan distribution={consumption.distributionByPlan} />
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </div>
        )}
      </div>
    </div>
  );
};

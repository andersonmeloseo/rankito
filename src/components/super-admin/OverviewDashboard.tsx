import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSaasMetrics } from "@/hooks/useSaasMetrics";
import { DollarSign, TrendingUp, Users, Target, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const OverviewDashboard = () => {
  const { data: metrics, isLoading } = useSaasMetrics();

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
    <div className="space-y-6">
      {/* Alert Cards */}
      <div className="grid gap-4">
        {metrics && metrics.pendingPaymentsCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {metrics.pendingPaymentsCount} pagamentos pendentes - Total: {formatCurrency(metrics.pendingAmount)}
            </AlertDescription>
          </Alert>
        )}
        
        {metrics && metrics.trialsExpiringSoon > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {metrics.trialsExpiringSoon} trials expirando nos próximos 7 dias
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.mrr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly Recurring Revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(metrics?.mrrGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(metrics?.mrrGrowth || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.activeUsers || 0} / {metrics?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalUsers ? ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1) : 0}% da base
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversão Trial → Pago</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.conversionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trials Expirando</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.trialsExpiringSoon || 0}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.pendingAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.pendingPaymentsCount || 0} pagamentos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

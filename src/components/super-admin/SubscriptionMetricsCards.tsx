import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, AlertCircle, TrendingDown, Wallet } from "lucide-react";
import { useSubscriptionMetrics } from "@/hooks/useSubscriptionMetrics";

export const SubscriptionMetricsCards = () => {
  const { data: metrics, isLoading } = useSubscriptionMetrics();

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando métricas...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">MRR</CardTitle>
          <DollarSign className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.mrr || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Receita recorrente mensal
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
          <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
          <Users className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.activeSubscribers || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Usuários com assinatura ativa
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
          <AlertCircle className="h-5 w-5 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.pendingPaymentsCount || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(metrics?.pendingAmount || 0)} pendentes
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
          <TrendingDown className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(metrics?.churnRate || 0).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Taxa de cancelamento
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <Wallet className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Lifetime value
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

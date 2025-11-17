import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EcommerceFilters } from "./EcommerceFilters";
import { EcommerceOverviewCards } from "../EcommerceOverviewCards";
import { EcommerceProjectsTable } from "./EcommerceProjectsTable";
import { EcommerceFunnelChart } from "./EcommerceFunnelChart";
import { TopProductsTable } from "./TopProductsTable";
import { RevenueEvolutionChart } from "../RevenueEvolutionChart";
import { useEcommerceComparison } from "@/hooks/useEcommerceComparison";
import { useGlobalEcommerceMetrics } from "@/hooks/useGlobalEcommerceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export const EcommerceTab = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [period, setPeriod] = useState("30");
  const { data: comparison } = useEcommerceComparison(userId, Number(period));
  const { data: ecommerceMetrics } = useGlobalEcommerceMetrics(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getGrowthBadge = (growth: number) => {
    const isPositive = growth > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="font-semibold">{Math.abs(growth).toFixed(1)}%</span>
      </div>
    );
  };

  if (!userId) return null;

  return (
    <div className="space-y-8">
      {/* Filters */}
      <EcommerceFilters period={period} onPeriodChange={setPeriod} />

      {/* Comparison Cards */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita vs Período Anterior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{formatCurrency(comparison.current.revenue)}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Anterior: {formatCurrency(comparison.previous.revenue)}
                  </span>
                  {getGrowthBadge(comparison.growth.revenue)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pedidos vs Período Anterior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{comparison.current.orders}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Anterior: {comparison.previous.orders}
                  </span>
                  {getGrowthBadge(comparison.growth.orders)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Médio vs Anterior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{formatCurrency(comparison.current.aov)}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Anterior: {formatCurrency(comparison.previous.aov)}
                  </span>
                  {getGrowthBadge(comparison.growth.aov)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {comparison.current.productViews > 0 
                    ? ((comparison.current.orders / comparison.current.productViews) * 100).toFixed(2)
                    : "0.00"}%
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Anterior: {comparison.previous.productViews > 0 
                      ? ((comparison.previous.orders / comparison.previous.productViews) * 100).toFixed(2)
                      : "0.00"}%
                  </span>
                  {getGrowthBadge(comparison.growth.conversionRate)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Period Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Métricas do Período Selecionado</h3>
        <EcommerceOverviewCards 
          totalRevenue={ecommerceMetrics?.totalRevenue || 0}
          globalAOV={ecommerceMetrics?.globalAOV || 0}
          activeSites={ecommerceMetrics?.activeSites || 0}
          totalSites={0}
          totalOrders={ecommerceMetrics?.totalOrders || 0}
          isLoading={false}
        />
      </div>

      {/* Revenue Evolution Chart */}
      <RevenueEvolutionChart 
        data={ecommerceMetrics?.revenueEvolution || []} 
        isLoading={false} 
      />

      {/* Funnel and Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EcommerceFunnelChart userId={userId} />
        <TopProductsTable userId={userId} />
      </div>

      {/* Complete Projects Table */}
      <EcommerceProjectsTable userId={userId} />
    </div>
  );
};

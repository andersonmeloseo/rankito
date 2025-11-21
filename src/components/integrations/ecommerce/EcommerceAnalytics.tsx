import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, TrendingUp, Eye, DollarSign, AlertCircle, ShoppingBag, Package } from "lucide-react";
import { useEcommerceAnalytics } from "@/hooks/useEcommerceAnalytics";
import { RevenueEvolutionChart } from "@/components/dashboard/RevenueEvolutionChart";
import { ConversionFunnelVisual } from "./ConversionFunnelVisual";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodComparisonCard } from "./PeriodComparisonCard";
import { ProductsFullTable } from "./ProductsFullTable";

interface EcommerceAnalyticsProps {
  siteId: string;
}

export const EcommerceAnalytics = ({ siteId }: EcommerceAnalyticsProps) => {
  const [period, setPeriod] = useState<string>("30");
  
  try {
    console.log('🎯 EcommerceAnalytics renderizando:', { siteId });
    
    if (!siteId) {
      console.warn('⚠️ siteId inválido');
      return (
        <div className="p-4">
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-muted-foreground">ID do site inválido</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const { metrics, previousMetrics, products, funnel, revenueEvolution, isLoading } = useEcommerceAnalytics(
      siteId, 
      parseInt(period)
    );

    console.log('📊 Hook state:', { isLoading, hasMetrics: !!metrics, hasProducts: !!products });

    if (isLoading) {
      console.log('⏳ Mostrando skeleton de loading...');
      return (
        <div className="space-y-4 p-4">
          <div className="text-sm text-muted-foreground mb-4 font-medium">
            Carregando dados de e-commerce...
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      );
    }

    console.log('✅ Renderizando conteúdo principal');

    return (
    <div className="space-y-6">
      {/* Period Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Período:</span>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                <TabsTrigger value="7">7 dias</TabsTrigger>
                <TabsTrigger value="30">30 dias</TabsTrigger>
                <TabsTrigger value="90">90 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Alert informativo quando não há dados */}
      {(!metrics || metrics.totalOrders === 0) && (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Nenhum evento de e-commerce registrado</CardTitle>
            </div>
            <CardDescription>
              Os dados abaixo estão zerados. Certifique-se de que o pixel está instalado 
              e que eventos de e-commerce estão sendo capturados (product_view, add_to_cart, purchase)
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {/* Métricas Principais com Comparação */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PeriodComparisonCard
          title="Receita Total"
          currentValue={metrics.totalRevenue}
          previousValue={previousMetrics.totalRevenue}
          formatter={(val) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(val)}
          icon={DollarSign}
        />

        <PeriodComparisonCard
          title="Ticket Médio"
          currentValue={metrics.averageOrderValue}
          previousValue={previousMetrics.averageOrderValue}
          formatter={(val) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(val)}
          icon={TrendingUp}
        />

        <PeriodComparisonCard
          title="Taxa de Conversão"
          currentValue={metrics.conversionRate}
          previousValue={previousMetrics.conversionRate}
          formatter={(val) => `${val.toFixed(2)}%`}
          icon={ShoppingCart}
        />

        <PeriodComparisonCard
          title="Visualizações"
          currentValue={metrics.productViews}
          previousValue={previousMetrics.productViews}
          formatter={(val) => val.toLocaleString('pt-BR')}
          icon={Eye}
        />
      </div>

      {/* Métricas Avançadas */}
      <div className="grid gap-4 md:grid-cols-2">
        <PeriodComparisonCard
          title="Taxa de Abandono de Carrinho"
          currentValue={metrics.cartAbandonmentRate}
          previousValue={previousMetrics.cartAbandonmentRate}
          formatter={(val) => `${val.toFixed(2)}%`}
          icon={ShoppingBag}
        />

        <PeriodComparisonCard
          title="Valor Médio por Produto"
          currentValue={metrics.averageProductValue}
          previousValue={previousMetrics.averageProductValue}
          formatter={(val) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(val)}
          icon={Package}
        />
      </div>

      {/* Revenue Evolution Chart */}
      <RevenueEvolutionChart data={revenueEvolution} isLoading={isLoading} />

      {/* Conversion Funnel Visual */}
      {funnel && (
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>
              Acompanhe a jornada do cliente desde a visualização até a compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConversionFunnelVisual funnel={{
              ...funnel,
              checkoutToPurchaseRate: funnel.checkoutToSaleRate
            }} />
          </CardContent>
        </Card>
      )}

      {/* Products Full Table */}
      {products && products.length > 0 && (
        <ProductsFullTable products={products} siteId={siteId} />
      )}
    </div>
  );
  } catch (error) {
    console.error('❌ Erro fatal no EcommerceAnalytics:', error);
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao Carregar E-commerce</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Erro desconhecido ao renderizar analytics'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por favor, recarregue a página ou entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
};
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEcommerceAnalytics } from "@/hooks/useEcommerceAnalytics";
import { formatCurrency } from "@/lib/utils";
import { 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Eye
} from "lucide-react";
import { ConversionFunnelVisual } from "./ConversionFunnelVisual";
import { RevenueEvolutionChart } from "@/components/dashboard/RevenueEvolutionChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    const { metrics, products, funnel, revenueEvolution, isLoading } = useEcommerceAnalytics(
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
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Receita Total</CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalOrders} pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Ticket Médio</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por pedido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Taxa de Conversão</CardDescription>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.conversionRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Visualizações → Compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Visualizações</CardDescription>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.productViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos visualizados
            </p>
          </CardContent>
        </Card>
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

      {/* Top Products */}
      {products && products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Produtos</CardTitle>
            <CardDescription>
              Produtos com melhor desempenho nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">{product.productName}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.conversionRate.toFixed(1)}% conversão
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{product.views} visualizações</span>
                      <span>{product.addToCarts} no carrinho</span>
                      <span>{product.purchases} vendas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
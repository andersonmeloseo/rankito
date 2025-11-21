import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEcommerceAnalytics } from "@/hooks/useEcommerceAnalytics";
import { formatCurrency } from "@/lib/utils";
import { 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Eye,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { subDays } from "date-fns";

interface EcommerceAnalyticsProps {
  siteId: string;
}

export const EcommerceAnalytics = ({ siteId }: EcommerceAnalyticsProps) => {
  if (!siteId) {
    return <div className="text-muted-foreground">ID do site inválido</div>;
  }

  const endDate = new Date();
  const startDate = subDays(endDate, 30);

  const { metrics, products, funnel, isLoading } = useEcommerceAnalytics(
    siteId,
    startDate,
    endDate
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Conversion Funnel */}
      {funnel && (
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>
              Acompanhe a jornada do cliente desde a visualização até a compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Visualizações de Produto</span>
                    </div>
                    <span className="text-sm font-bold">{funnel.productViews}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Adicionar ao Carrinho</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{funnel.addToCarts}</span>
                      <span className="text-xs text-muted-foreground">
                        ({funnel.viewToCartRate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${funnel.viewToCartRate}%` }} 
                    />
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Iniciar Checkout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{funnel.checkouts}</span>
                      <span className="text-xs text-muted-foreground">
                        ({funnel.cartToCheckoutRate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: `${funnel.cartToCheckoutRate}%` }} 
                    />
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Step 4 */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Compra Finalizada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{funnel.purchases}</span>
                      <span className="text-xs text-muted-foreground">
                        ({funnel.checkoutToSaleRate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ width: `${funnel.checkoutToSaleRate}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Overall Conversion */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Conversão Total</span>
                  <span className="text-lg font-bold text-primary">
                    {funnel.overallConversionRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
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
};
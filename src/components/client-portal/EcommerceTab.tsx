import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Eye, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface EcommerceTabProps {
  analytics: any;
}

export const EcommerceTab = ({ analytics }: EcommerceTabProps) => {
  const ecommerce = analytics?.ecommerce;

  // Debug log
  console.log('[EcommerceTab] 🛒 Renderizando componente:', {
    hasEcommerce: !!ecommerce,
    totalRevenue: ecommerce?.totalRevenue,
    totalOrders: ecommerce?.totalOrders,
    topProducts: ecommerce?.topProducts?.length,
    analytics
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!ecommerce) {
    return (
      <div className="space-y-6">
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <ShoppingCart className="h-4 w-4 text-amber-600" />
          <AlertDescription className="space-y-3">
            <p className="font-semibold text-foreground">Nenhum evento de e-commerce registrado ainda.</p>
            <p className="text-sm text-muted-foreground">
              Para começar a rastrear vendas, produtos e receita, certifique-se de que o pixel de rastreamento 
              está instalado corretamente e que eventos de e-commerce estão sendo enviados:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">product_view</code> - Visualização de produto</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">add_to_cart</code> - Adição ao carrinho</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">begin_checkout</code> - Início do checkout</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">purchase</code> - Compra finalizada</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(ecommerce.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pedidos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ecommerce.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ticket Médio (AOV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(ecommerce.averageOrderValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ecommerce.conversionRate.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Evolution Chart */}
      {ecommerce.revenueEvolution && ecommerce.revenueEvolution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ecommerce.revenueEvolution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Receita"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Pedidos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Conversion Funnel */}
      {ecommerce.funnel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Funil de Conversão E-commerce
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Visualizações de Produto</p>
                  <p className="text-2xl font-bold">{ecommerce.funnel.productViews}</p>
                </div>
                <Badge>100%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Adições ao Carrinho</p>
                  <p className="text-2xl font-bold">{ecommerce.funnel.addToCarts}</p>
                </div>
                <Badge variant="secondary">{ecommerce.funnel.viewToCartRate.toFixed(2)}%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                <div>
                  <p className="font-medium">Checkouts Iniciados</p>
                  <p className="text-2xl font-bold">{ecommerce.funnel.checkouts}</p>
                </div>
                <Badge variant="secondary">{ecommerce.funnel.cartToCheckoutRate.toFixed(2)}%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div>
                  <p className="font-medium">Compras Finalizadas</p>
                  <p className="text-2xl font-bold text-primary">{ecommerce.funnel.purchases}</p>
                </div>
                <Badge className="bg-primary">{ecommerce.funnel.checkoutToSaleRate.toFixed(2)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Products Table */}
      {ecommerce.topProducts && ecommerce.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-center">URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecommerce.topProducts.map((product: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right font-semibold">{product.purchases}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(product.revenue)}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.productUrl ? (
                          <a 
                            href={product.productUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
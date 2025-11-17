import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingCart, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EcommerceOverviewCardsProps {
  totalRevenue: number;
  globalAOV: number;
  activeSites: number;
  totalSites: number;
  totalOrders: number;
  isLoading?: boolean;
}

export const EcommerceOverviewCards = ({
  totalRevenue,
  globalAOV,
  activeSites,
  totalSites,
  totalOrders,
  isLoading
}: EcommerceOverviewCardsProps) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Total Revenue */}
      <Card className="shadow-card hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Últimos 30 dias
          </p>
        </CardContent>
      </Card>

      {/* Global AOV */}
      <Card className="shadow-card hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio Global
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(globalAOV)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Por pedido
          </p>
        </CardContent>
      </Card>

      {/* Sites with Sales */}
      <Card className="shadow-card hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sites com Vendas
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">
            {activeSites}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            de {totalSites} sites
          </p>
        </CardContent>
      </Card>

      {/* Total Orders */}
      <Card className="shadow-card hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
            <Package className="h-5 w-5 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {totalOrders}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pedidos concluídos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalEcommerceMetrics } from "@/hooks/useGlobalEcommerceMetrics";
import { ShoppingCart, Eye, Plus, CreditCard, CheckCircle } from "lucide-react";

interface EcommerceFunnelChartProps {
  userId: string;
}

export const EcommerceFunnelChart = ({ userId }: EcommerceFunnelChartProps) => {
  const { data: metrics, isLoading } = useGlobalEcommerceMetrics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão Global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando funil...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock data - seria calculado do backend
  const funnelData = [
    { stage: "Visualizações de Produto", count: 1000, icon: Eye, color: "bg-blue-500" },
    { stage: "Adicionado ao Carrinho", count: 450, icon: Plus, color: "bg-purple-500" },
    { stage: "Iniciou Checkout", count: 280, icon: CreditCard, color: "bg-orange-500" },
    { stage: "Compras Finalizadas", count: metrics?.totalOrders || 0, icon: CheckCircle, color: "bg-green-500" },
  ];

  const maxCount = funnelData[0].count;

  const calculateRate = (current: number, previous: number) => {
    return previous > 0 ? ((current / previous) * 100).toFixed(1) : "0.0";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Funil de Conversão Global
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {funnelData.map((stage, index) => {
            const percentage = (stage.count / maxCount) * 100;
            const previousStage = index > 0 ? funnelData[index - 1] : null;
            const conversionRate = previousStage 
              ? calculateRate(stage.count, previousStage.count)
              : "100.0";

            const Icon = stage.icon;

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stage.color} bg-opacity-10`}>
                      <Icon className={`h-5 w-5 ${stage.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <p className="font-medium">{stage.stage}</p>
                      <p className="text-sm text-muted-foreground">
                        {stage.count.toLocaleString("pt-BR")} eventos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">taxa de conversão</p>
                  </div>
                </div>
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full ${stage.color} transition-all duration-500 flex items-center justify-end pr-4`}
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Taxa Global</p>
              <p className="text-2xl font-bold text-green-600">
                {calculateRate(metrics?.totalOrders || 0, 1000)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Abandono de Carrinho</p>
              <p className="text-2xl font-bold text-orange-600">
                {calculateRate(450 - 280, 450)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

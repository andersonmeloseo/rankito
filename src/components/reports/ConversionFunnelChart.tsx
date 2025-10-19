import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";

interface FunnelStage {
  name: string;
  value: number;
  rate?: number;
}

interface ConversionFunnelChartProps {
  data: {
    pageViews: number;
    interactions: number;
    conversions: number;
  };
  isLoading?: boolean;
}

export const ConversionFunnelChart = ({ data, isLoading }: ConversionFunnelChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = data.pageViews;
  const interactionRate = maxValue > 0 ? (data.interactions / maxValue) * 100 : 0;
  const conversionRate = data.interactions > 0 ? (data.conversions / data.interactions) * 100 : 0;
  const overallRate = maxValue > 0 ? (data.conversions / maxValue) * 100 : 0;

  const stages: FunnelStage[] = [
    { name: "Page Views", value: data.pageViews, rate: 100 },
    { name: "Interações", value: data.interactions, rate: interactionRate },
    { name: "Conversões", value: data.conversions, rate: conversionRate }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Funil de Conversão</CardTitle>
        <p className="text-sm text-muted-foreground">
          Taxa de conversão geral: <span className="font-bold text-primary">{overallRate.toFixed(2)}%</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            // Larguras fixas para cada estágio do funil
            const funnelWidths = [90, 70, 40]; // Page Views, Interações, Conversões
            const widthPercentage = funnelWidths[index];
            const colors = [
              "from-blue-500 to-blue-600",
              "from-purple-500 to-purple-600",
              "from-green-500 to-green-600"
            ];

            return (
              <div key={stage.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stage.name}</span>
                    {index > 0 && (
                      <ArrowDown className="h-4 w-4 text-muted-foreground animate-bounce" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{stage.value.toLocaleString()}</div>
                    {stage.rate !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        {stage.rate.toFixed(1)}% do anterior
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative h-16 w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                  <div
                    className={`h-full bg-gradient-to-r ${colors[index]} transition-all duration-1000 ease-out flex items-center justify-center text-white font-bold shadow-lg rounded-lg`}
                    style={{ 
                      width: `${widthPercentage}%`,
                      minWidth: stage.value > 0 ? '60px' : '0'
                    }}
                  >
                    {stage.value > 0 && (
                      <span className="text-sm drop-shadow-lg">
                        {stage.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Insights */}
        <div className="mt-6 pt-6 border-t space-y-2">
          <p className="text-sm font-semibold">💡 Insights:</p>
          {interactionRate < 50 && (
            <p className="text-sm text-muted-foreground">
              • Apenas {interactionRate.toFixed(1)}% dos visitantes interagem com o site
            </p>
          )}
          {conversionRate < 20 && data.interactions > 0 && (
            <p className="text-sm text-muted-foreground">
              • Taxa de conversão de interações baixa ({conversionRate.toFixed(1)}%)
            </p>
          )}
          {overallRate < 5 && (
            <p className="text-sm text-muted-foreground">
              • Taxa de conversão geral abaixo de 5% - oportunidade de otimização
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

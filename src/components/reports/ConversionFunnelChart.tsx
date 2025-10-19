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
                <div className="flex items-center justify-center gap-2">
                  <span className="font-medium">{stage.name}</span>
                  {index > 0 && (
                    <ArrowDown className="h-4 w-4 text-muted-foreground animate-bounce" />
                  )}
                  <div className="text-right ml-2">
                    <span className="font-bold text-lg">{stage.value.toLocaleString()}</span>
                    {stage.rate !== undefined && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({stage.rate.toFixed(1)}%)
                      </span>
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
        
        {/* Insights e Legendas */}
        <div className="mt-6 pt-6 border-t space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">💡 Insight:</p>
            {overallRate < 5 ? (
              <p className="text-sm text-muted-foreground">
                Taxa de conversão geral de {overallRate.toFixed(2)}% indica oportunidade de otimização nos CTAs e jornada do usuário.
              </p>
            ) : overallRate < 10 ? (
              <p className="text-sm text-muted-foreground">
                Performance saudável com {overallRate.toFixed(2)}% de conversão. Continue otimizando para alcançar 10%+.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Excelente taxa de conversão de {overallRate.toFixed(2)}%! Seu funil está bem otimizado.
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">📖 Legenda:</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Page Views:</span>
                  <span className="text-muted-foreground ml-1">
                    Visualizações de página - total de acessos às páginas do seu site
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-purple-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Interações:</span>
                  <span className="text-muted-foreground ml-1">
                    Estimativa de usuários que demonstraram interesse (baseado em conversões × 1.5)
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-green-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Conversões:</span>
                  <span className="text-muted-foreground ml-1">
                    Cliques em botões de ação (WhatsApp, telefone, formulários, etc.)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

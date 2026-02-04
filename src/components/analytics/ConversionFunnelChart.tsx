import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { SkeletonChart } from "@/components/ui/skeleton-modern";

interface ConversionFunnelChartProps {
  data: {
    pageViews: number;
    interactions: number;
    conversions: number;
  };
  isLoading: boolean;
}

export const ConversionFunnelChart = ({ data, isLoading }: ConversionFunnelChartProps) => {
  if (isLoading) {
    return (
      <Card className="card-modern animate-scale-in">
        <CardHeader>
          <CardTitle>Funil de Ação</CardTitle>
          <CardDescription>Jornada do visitante até a ação</CardDescription>
        </CardHeader>
        <CardContent>
          <SkeletonChart height={300} />
        </CardContent>
      </Card>
    );
  }

  const { pageViews, interactions, conversions } = data;
  const interactionRate = pageViews > 0 ? ((interactions / pageViews) * 100).toFixed(1) : "0";
  const conversionRate = interactions > 0 ? ((conversions / interactions) * 100).toFixed(1) : "0";
  
  // Larguras seguras para o funil visual
  const interactionWidth = pageViews > 0 ? Math.max((interactions / pageViews) * 100, 10) : 75;
  const conversionWidth = pageViews > 0 ? Math.max((conversions / pageViews) * 100, 10) : 50;

  return (
    <Card className="card-modern card-interactive animate-scale-in">
      <CardHeader>
        <CardTitle>Funil de Ação</CardTitle>
        <CardDescription>Jornada do visitante até a ação</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Visualizações */}
          <div className="relative animate-slide-up" style={{ animationDelay: '0s' }}>
            <div className="flex justify-center">
              <div 
                className="h-24 bg-gradient-to-r from-primary/40 to-primary/30 rounded-xl flex items-center justify-between px-6 transition-all hover:shadow-lg border border-primary/30"
                style={{ width: "100%", maxWidth: "100%" }}
              >
                <div>
                  <p className="text-sm text-primary font-medium">Visualizações</p>
                  <p className="text-3xl font-bold text-foreground">{pageViews.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-primary font-semibold">100%</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <ChevronDown className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>

          {/* Interações */}
          <div className="relative animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex justify-center">
              <div 
                className="h-24 bg-gradient-to-r from-orange-500/40 to-orange-400/30 rounded-xl flex items-center justify-between px-6 transition-all hover:shadow-lg border border-orange-500/30"
                style={{ width: `${interactionWidth}%`, minWidth: "75%" }}
              >
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Interações</p>
                  <p className="text-3xl font-bold text-foreground">{interactions.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-orange-600 dark:text-orange-400 font-semibold">{interactionRate}%</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <ChevronDown className="w-6 h-6 text-orange-500 animate-pulse" />
            </div>
          </div>

          {/* Conversões */}
          <div className="relative animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-center">
              <div 
                className="h-24 bg-gradient-to-r from-success/40 to-success/30 rounded-xl flex items-center justify-between px-6 transition-all hover:shadow-lg hover:shadow-success/20 border border-success/30"
                style={{ width: `${conversionWidth}%`, minWidth: "50%" }}
              >
                <div>
                  <p className="text-sm font-medium text-success">Ações</p>
                  <p className="text-3xl font-bold text-foreground">{conversions.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">{conversionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

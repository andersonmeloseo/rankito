import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

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
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
          <CardDescription>Jornada do visitante até a conversão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { pageViews, interactions, conversions } = data;
  const interactionRate = pageViews > 0 ? ((interactions / pageViews) * 100).toFixed(1) : "0";
  const conversionRate = interactions > 0 ? ((conversions / interactions) * 100).toFixed(1) : "0";

  return (
    <Card className="shadow-lg border-border/50 animate-fade-in hover:shadow-xl transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Funil de Conversão
        </CardTitle>
        <CardDescription>Jornada do visitante até a conversão</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Visualizações */}
          <div className="relative animate-scale-in">
            <div 
              className="h-24 bg-gradient-to-r from-primary/30 to-primary/20 rounded-xl flex items-center justify-between px-6 transition-all hover:shadow-md border border-primary/20"
              style={{ width: "100%" }}
            >
              <div>
                <p className="text-sm text-muted-foreground font-medium">👁️ Visualizações</p>
                <p className="text-3xl font-bold">{pageViews.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-lg text-muted-foreground font-semibold">100%</p>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <ChevronDown className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>

          {/* Interações */}
          <div className="relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div 
              className="h-24 bg-gradient-to-r from-primary/50 to-primary/40 rounded-xl flex items-center justify-between px-6 transition-all hover:shadow-md border border-primary/30"
              style={{ width: `${(interactions / pageViews * 100) || 0}%`, minWidth: "40%" }}
            >
              <div>
                <p className="text-sm text-muted-foreground font-medium">🖱️ Interações</p>
                <p className="text-3xl font-bold">{interactions.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-lg text-primary font-semibold">{interactionRate}%</p>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <ChevronDown className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>

          {/* Conversões */}
          <div className="relative animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div 
              className="h-24 bg-gradient-to-r from-green-500/60 to-green-500/40 rounded-xl flex items-center justify-between px-6 transition-all hover:shadow-md hover:shadow-green-500/20 border border-green-500/30"
              style={{ width: `${(conversions / pageViews * 100) || 0}%`, minWidth: "30%" }}
            >
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">✅ Conversões</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-50">{conversions.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-700 dark:text-green-300">{conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
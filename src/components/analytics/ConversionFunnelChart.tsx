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
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
        <CardDescription>Jornada do visitante até a conversão</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Visualizações */}
          <div className="relative">
            <div 
              className="h-20 bg-primary/20 rounded-lg flex items-center justify-between px-6 transition-all"
              style={{ width: "100%" }}
            >
              <div>
                <p className="text-sm text-muted-foreground">Visualizações</p>
                <p className="text-2xl font-bold">{pageViews.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">100%</p>
              </div>
            </div>
            <div className="flex justify-center mt-2">
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Interações */}
          <div className="relative">
            <div 
              className="h-20 bg-primary/40 rounded-lg flex items-center justify-between px-6 transition-all"
              style={{ width: `${(interactions / pageViews * 100) || 0}%`, minWidth: "40%" }}
            >
              <div>
                <p className="text-sm text-muted-foreground">Interações</p>
                <p className="text-2xl font-bold">{interactions.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{interactionRate}%</p>
              </div>
            </div>
            <div className="flex justify-center mt-2">
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Conversões */}
          <div className="relative">
            <div 
              className="h-20 bg-success/60 rounded-lg flex items-center justify-between px-6 transition-all"
              style={{ width: `${(conversions / pageViews * 100) || 0}%`, minWidth: "30%" }}
            >
              <div>
                <p className="text-sm text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold">{conversions.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-success font-semibold">{conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
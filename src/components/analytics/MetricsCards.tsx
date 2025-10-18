import { Card, CardContent } from "@/components/ui/card";
import { Users, Eye, MousePointerClick, TrendingUp } from "lucide-react";

interface MetricsCardsProps {
  metrics: any;
  isLoading: boolean;
}

export const MetricsCards = ({ metrics, isLoading }: MetricsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics?.uniqueVisitors?.toLocaleString() || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-primary opacity-60" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Visualizações</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics?.pageViews?.toLocaleString() || 0}
              </p>
            </div>
            <Eye className="w-8 h-8 text-primary opacity-60" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversões</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics?.conversions?.toLocaleString() || 0}
              </p>
            </div>
            <MousePointerClick className="w-8 h-8 text-success opacity-60" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics?.conversionRate || 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success opacity-60" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

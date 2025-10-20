import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'chart' | 'trend' | 'clock';
}

export const EmptyState = ({ 
  title = "Nenhum dado disponível ainda",
  description = "Aguardando as primeiras conversões e visualizações...",
  icon = 'chart'
}: EmptyStateProps) => {
  const Icon = icon === 'chart' ? BarChart3 : icon === 'trend' ? TrendingUp : Clock;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg mb-2">{title}</CardTitle>
          <CardDescription className="max-w-md">{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};

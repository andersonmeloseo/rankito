import { BarChart3, TrendingUp, Clock } from "lucide-react";
import { IllustratedEmptyState } from "@/components/ui/illustrated-empty-state";

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
  const iconMap = {
    chart: BarChart3,
    trend: TrendingUp,
    clock: Clock,
  };

  return (
    <div className="card-modern">
      <IllustratedEmptyState
        illustration="charts"
        icon={iconMap[icon]}
        title={title}
        description={description}
      />
    </div>
  );
};

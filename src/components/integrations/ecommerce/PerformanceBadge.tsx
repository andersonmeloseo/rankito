import { Badge } from "@/components/ui/badge";
import { Trophy, Star, AlertTriangle, TrendingUp, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type PerformanceType = "top" | "featured" | "warning" | "growth" | "recovery";

interface PerformanceBadgeProps {
  type: PerformanceType;
}

const badgeConfig: Record<PerformanceType, {
  label: string;
  icon: React.ElementType;
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  description: string;
}> = {
  top: {
    label: "Top Performer",
    icon: Trophy,
    variant: "success",
    description: "Produto com maior receita ou conversão"
  },
  featured: {
    label: "Destaque",
    icon: Star,
    variant: "default",
    description: "Produto entre os 3 mais vendidos"
  },
  warning: {
    label: "Atenção",
    icon: AlertTriangle,
    variant: "warning",
    description: "Alta visualização mas baixa conversão"
  },
  growth: {
    label: "Crescimento",
    icon: TrendingUp,
    variant: "secondary",
    description: "Aumento significativo vs. período anterior"
  },
  recovery: {
    label: "Recuperação",
    icon: RotateCcw,
    variant: "outline",
    description: "Voltou a converter após período sem vendas"
  }
};

export const PerformanceBadge = ({ type }: PerformanceBadgeProps) => {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="flex items-center gap-1 cursor-help">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

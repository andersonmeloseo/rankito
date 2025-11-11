import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EngagementBadgeProps {
  score: number;
  timeOnPage?: number;
  scrollDepth?: number;
  size?: "sm" | "md" | "lg";
}

export const EngagementBadge = ({ score, timeOnPage, scrollDepth, size = "md" }: EngagementBadgeProps) => {
  const getScoreInfo = () => {
    if (score >= 75) return { color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-100 dark:border-green-800", label: "Alto", icon: TrendingUp };
    if (score >= 50) return { color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-100 dark:border-yellow-800", label: "Médio", icon: Minus };
    if (score >= 25) return { color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-100 dark:border-orange-800", label: "Baixo", icon: TrendingDown };
    return { color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-100 dark:border-red-800", label: "Muito Baixo", icon: TrendingDown };
  };

  const info = getScoreInfo();
  const Icon = info.icon;

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-semibold">Score de Engajamento: {score}/100</div>
      {timeOnPage !== undefined && (
        <div>⏱️ Tempo ativo: {Math.floor(timeOnPage / 60)}:{(timeOnPage % 60).toString().padStart(2, '0')}</div>
      )}
      {scrollDepth !== undefined && (
        <div>📊 Scroll: {scrollDepth}%</div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${info.color} flex items-center gap-1 cursor-help ${
              size === "sm" ? "text-xs px-2 py-0.5" : 
              size === "lg" ? "text-sm px-3 py-1" : 
              "text-xs px-2 py-1"
            }`}
          >
            <Activity className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
            {score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

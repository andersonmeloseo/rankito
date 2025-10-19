import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface ComparisonMetricCardProps {
  title: string;
  currentValue: number | string;
  previousValue?: number | string;
  changePercentage?: number;
  icon: LucideIcon;
  color: string;
}

export const ComparisonMetricCard = ({
  title,
  currentValue,
  previousValue,
  changePercentage,
  icon: Icon,
  color
}: ComparisonMetricCardProps) => {
  const isPositive = (changePercentage || 0) >= 0;
  const Arrow = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5" style={{ color }} />
          {changePercentage !== undefined && (
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <Arrow className="h-3 w-3" />
              {Math.abs(changePercentage).toFixed(1)}%
            </Badge>
          )}
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className="text-3xl font-bold mb-1">{currentValue}</p>
        {previousValue !== undefined && (
          <p className="text-xs text-muted-foreground">
            vs {previousValue} no período anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
};

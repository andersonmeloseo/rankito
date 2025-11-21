import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface PeriodComparisonCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  formatter?: (value: number) => string;
  icon: LucideIcon;
}

export const PeriodComparisonCard = ({
  title,
  currentValue,
  previousValue,
  formatter = (val) => val.toString(),
  icon: Icon,
}: PeriodComparisonCardProps) => {
  const growth = previousValue === 0 
    ? (currentValue > 0 ? 100 : 0) 
    : ((currentValue - previousValue) / previousValue) * 100;

  const isGrowth = growth > 0;
  const isStable = Math.abs(growth) < 1;

  const TrendIcon = isStable ? Minus : isGrowth ? TrendingUp : TrendingDown;
  const trendColor = isStable
    ? "text-muted-foreground"
    : isGrowth
    ? "text-success"
    : "text-destructive";

  const badgeVariant = isStable ? "secondary" : isGrowth ? "success" : "destructive";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatter(currentValue)}</div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={badgeVariant} className="flex items-center gap-1">
            <TrendIcon className={`h-3 w-3 ${trendColor}`} />
            {Math.abs(growth).toFixed(1)}%
          </Badge>
          <p className="text-xs text-muted-foreground">
            vs. período anterior ({formatter(previousValue)})
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

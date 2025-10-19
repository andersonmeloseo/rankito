import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export const MetricsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}: MetricsCardProps) => {
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <h3 className="text-3xl font-bold tracking-tight mb-1">
              {value}
            </h3>
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {trendUp ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-600" />
                )}
                <span className={trendUp ? "text-green-600" : "text-red-600"}>
                  {Math.abs(trend)}%
                </span>
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconBgColor}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

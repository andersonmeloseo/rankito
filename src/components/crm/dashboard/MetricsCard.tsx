import { LucideIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  iconColor?: string;
  iconBgColor?: string;
}

const iconVariantMap: Record<string, string> = {
  "text-primary": "icon-gradient-blue",
  "text-success": "icon-gradient-green",
  "text-warning": "icon-gradient-orange",
  "text-accent": "icon-gradient-emerald",
  "text-destructive": "icon-gradient-rose",
  "text-info": "icon-gradient-cyan",
};

export const MetricsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  iconColor = "text-primary",
}: MetricsCardProps) => {
  const trendUp = trend !== undefined && trend >= 0;
  const iconClass = iconVariantMap[iconColor] || "icon-gradient-blue";

  return (
    <div className="card-modern p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="metric-label mb-2">{title}</p>
          <h3 className="metric-value mb-1">{value}</h3>
          {trend !== undefined && (
            <div className="metric-trend">
              {trendUp ? (
                <ArrowUpIcon className="w-4 h-4 text-metric-positive" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-metric-negative" />
              )}
              <span className={trendUp ? "metric-trend-up" : "metric-trend-down"}>
                {Math.abs(trend)}%
              </span>
              <span className="text-muted-foreground ml-1">vs mês anterior</span>
            </div>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("icon-container", iconClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

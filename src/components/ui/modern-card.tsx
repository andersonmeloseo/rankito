import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "gradient-border" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, variant = "default", padding = "md", ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const variantClasses = {
      default: "card-modern",
      glass: "card-glass",
      "gradient-border": "card-gradient-border",
      interactive: "card-interactive",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      />
    );
  }
);
ModernCard.displayName = "ModernCard";

interface ModernCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconVariant?: "blue" | "green" | "orange" | "purple" | "rose" | "cyan" | "indigo" | "emerald";
  action?: React.ReactNode;
}

const ModernCardHeader = React.forwardRef<HTMLDivElement, ModernCardHeaderProps>(
  ({ className, title, subtitle, icon: Icon, iconVariant = "blue", action, ...props }, ref) => {
    const iconGradientClasses = {
      blue: "icon-gradient-blue",
      green: "icon-gradient-green",
      orange: "icon-gradient-orange",
      purple: "icon-gradient-purple",
      rose: "icon-gradient-rose",
      cyan: "icon-gradient-cyan",
      indigo: "icon-gradient-indigo",
      emerald: "icon-gradient-emerald",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between gap-4", className)}
        {...props}
      >
        <div className="flex items-start gap-4">
          {Icon && (
            <div className={cn("icon-container", iconGradientClasses[iconVariant])}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="font-semibold text-foreground tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);
ModernCardHeader.displayName = "ModernCardHeader";

interface ModernCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModernCardContent = React.forwardRef<HTMLDivElement, ModernCardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-4", className)} {...props} />
  )
);
ModernCardContent.displayName = "ModernCardContent";

interface MetricDisplayProps {
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  size?: "sm" | "md" | "lg";
}

const MetricDisplay = ({ value, label, trend, size = "md" }: MetricDisplayProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex flex-col">
      <span className={cn("font-bold tracking-tight", sizeClasses[size])}>
        {value}
      </span>
      <span className="metric-label mt-1">{label}</span>
      {trend && (
        <span
          className={cn(
            "metric-trend mt-2",
            trend.isPositive ? "metric-trend-up" : "metric-trend-down"
          )}
        >
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          <span className="text-muted-foreground ml-1">vs mês anterior</span>
        </span>
      )}
    </div>
  );
};

export { ModernCard, ModernCardHeader, ModernCardContent, MetricDisplay };

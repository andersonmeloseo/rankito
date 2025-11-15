import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Metric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
}

interface GSCClickableCardProps {
  title: string;
  icon: LucideIcon;
  metrics: Metric[];
  status?: 'success' | 'warning' | 'error' | 'info';
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
  };
  onClick: () => void;
  className?: string;
}

export function GSCClickableCard({
  title,
  icon: Icon,
  metrics,
  status = 'info',
  badge,
  onClick,
  className,
}: GSCClickableCardProps) {
  const statusColors = {
    success: 'border-green-500/20 hover:border-green-500/40',
    warning: 'border-yellow-500/20 hover:border-yellow-500/40',
    error: 'border-red-500/20 hover:border-red-500/40',
    info: 'border-primary/20 hover:border-primary/40',
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg',
        statusColors[status],
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {badge && (
          <Badge variant={badge.variant || 'default'} className="text-xs">
            {badge.text}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span 
                className="text-xs text-muted-foreground"
                title={metric.tooltip}
              >
                {metric.label}
              </span>
              <span 
                className="text-sm font-semibold truncate max-w-[100px]" 
                title={metric.tooltip || String(metric.value)}
              >
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

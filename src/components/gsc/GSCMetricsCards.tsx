import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link, FileText, Send, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AggregatedStats {
  totalIntegrations: number;
  activeIntegrations: number;
  inactiveIntegrations: number;
  totalSitemaps: number;
  totalUrlsSubmitted: number;
  totalUrlsIndexed: number;
  totalErrors: number;
  totalWarnings: number;
  quotaUsed: number;
  quotaLimit: number;
  quotaPercentage: number;
  quotaResetIn: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  progress?: number;
}

const MetricCard = ({ title, value, subtitle, icon, variant = 'default', progress }: MetricCardProps) => {
  const variantStyles = {
    default: 'border-border bg-card',
    success: 'border-green-200 bg-green-50 dark:bg-green-950/20',
    warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
    error: 'border-red-200 bg-red-50 dark:bg-red-950/20',
  };

  const iconBgStyles = {
    default: 'bg-muted',
    success: 'bg-green-100 dark:bg-green-900/30',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30',
    error: 'bg-red-100 dark:bg-red-900/30',
  };

  return (
    <Card className={cn('p-6', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {progress !== undefined && (
            <Progress value={progress} className="h-2 mt-3" />
          )}
        </div>
        <div className={cn("p-3 rounded-full ml-4", iconBgStyles[variant])}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

interface GSCMetricsCardsProps {
  stats?: AggregatedStats;
}

export const GSCMetricsCards = ({ stats }: GSCMetricsCardsProps) => {
  if (!stats) return null;

  const indexationRate = stats.totalUrlsSubmitted > 0
    ? ((stats.totalUrlsIndexed / stats.totalUrlsSubmitted) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Integrações Ativas"
        value={stats.activeIntegrations}
        subtitle={`${stats.totalIntegrations} no total`}
        icon={<Link className="h-5 w-5 text-blue-600" />}
        variant={stats.inactiveIntegrations > 0 ? 'warning' : 'success'}
      />
      
      <MetricCard
        title="Sitemaps Submetidos"
        value={stats.totalSitemaps}
        subtitle={`${stats.totalUrlsIndexed}/${stats.totalUrlsSubmitted} URLs indexadas (${indexationRate}%)`}
        icon={<FileText className="h-5 w-5 text-purple-600" />}
      />
      
      <MetricCard
        title="Quota de Hoje"
        value={`${stats.quotaUsed}/${stats.quotaLimit}`}
        subtitle={`Reset em ${stats.quotaResetIn}`}
        icon={<Send className="h-5 w-5 text-green-600" />}
        variant={
          stats.quotaPercentage >= 90 ? 'error' :
          stats.quotaPercentage >= 70 ? 'warning' : 'success'
        }
        progress={stats.quotaPercentage}
      />
      
      <MetricCard
        title="Erros/Avisos"
        value={stats.totalErrors + stats.totalWarnings}
        subtitle={`${stats.totalErrors} erros, ${stats.totalWarnings} avisos`}
        icon={<AlertCircle className="h-5 w-5 text-red-600" />}
        variant={stats.totalErrors > 0 ? 'error' : 'default'}
      />
    </div>
  );
};

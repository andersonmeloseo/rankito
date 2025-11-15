import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useGSCIntegrations } from '@/hooks/useGSCIntegrations';
import { useGSCSitemaps } from '@/hooks/useGSCSitemaps';
import { useGSCSchedules } from '@/hooks/useGSCSchedules';
import { Skeleton } from '@/components/ui/skeleton';

interface GSCHealthStatusProps {
  siteId: string;
  userId: string;
  onNavigateToTab: (tab: string) => void;
}

export function GSCHealthStatus({ siteId, userId, onNavigateToTab }: GSCHealthStatusProps) {
  const { integrations, isLoading: integrationsLoading } = useGSCIntegrations(siteId, userId);
  const { sitemaps, isLoading: sitemapsLoading } = useGSCSitemaps({ siteId });
  const { schedules, isLoading: schedulesLoading } = useGSCSchedules({ siteId });

  const isLoading = integrationsLoading || sitemapsLoading || schedulesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status de Saúde do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get health items
  const healthItems = [];

  // Integrations health
  integrations?.forEach((integration) => {
    healthItems.push({
      label: integration.connection_name,
      status: integration.health_status || 'checking',
      message: integration.last_error || 'Funcionando normalmente',
      tab: 'connections',
    });
  });

  // Sitemaps with errors
  const sitemapsWithErrors = sitemaps?.filter(s => (s.gsc_errors_count || 0) > 0) || [];
  if (sitemapsWithErrors.length > 0) {
    sitemapsWithErrors.forEach((sitemap) => {
      healthItems.push({
        label: `Sitemap: ${sitemap.sitemap_url}`,
        status: 'warning',
        message: `${sitemap.gsc_errors_count} erros encontrados`,
        tab: 'sitemaps',
      });
    });
  }

  // Active schedules
  const activeSchedules = schedules?.filter(s => s.is_active) || [];
  activeSchedules.forEach((schedule) => {
    healthItems.push({
      label: schedule.schedule_name,
      status: 'healthy',
      message: `Próxima execução: ${new Date(schedule.next_run_at).toLocaleString('pt-BR')}`,
      tab: 'schedules',
    });
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">Saudável</Badge>;
      case 'warning':
        return <Badge variant="warning">Atenção</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Erro</Badge>;
      case 'checking':
        return <Badge variant="default">Verificando</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status de Saúde do Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        {healthItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum item para monitorar ainda
          </p>
        ) : (
          <div className="space-y-3">
            {healthItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onNavigateToTab(item.tab)}
              >
                <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.label}</p>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

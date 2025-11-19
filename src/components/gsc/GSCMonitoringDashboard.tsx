import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GSCQuotaChart } from './GSCQuotaChart';
import { GSCActivityTimeline } from './GSCActivityTimeline';
import { GSCAlertsBanner } from './GSCAlertsBanner';
import { GSCQuotaWarningBanner } from './GSCQuotaWarningBanner';
import { GSCAlertsDashboard } from './GSCAlertsDashboard';
import { GSCDiscoveredUrlsTable } from './GSCDiscoveredUrlsTable';
import { GSCJobsHistory } from './GSCJobsHistory';
import { useGSCMonitoring } from '@/hooks/useGSCMonitoring';
import { useGSCActivity } from '@/hooks/useGSCActivity';
import { useGSCPagesDiscovery } from '@/hooks/useGSCPagesDiscovery';
import { useGSCSitemapsProcess } from '@/hooks/useGSCSitemapsProcess';
import { useGSCIntegrations } from '@/hooks/useGSCIntegrations';
import { Search, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GSCMonitoringDashboardProps {
  siteId: string;
  userId: string;
}

export const GSCMonitoringDashboard = ({ siteId, userId }: GSCMonitoringDashboardProps) => {
  const { 
    aggregatedStats, 
    isLoading: isLoadingStats 
  } = useGSCMonitoring({ siteId, userId });
  
  const {
    activityTimeline,
    isLoading: isLoadingActivity
  } = useGSCActivity({ siteId });

  const { integrations } = useGSCIntegrations(siteId, userId);
  const pagesDiscovery = useGSCPagesDiscovery();
  const sitemapsProcess = useGSCSitemapsProcess();

  const handlePagesDiscovery = async () => {
    const activeIntegration = integrations?.find(i => i.is_active);
    if (!activeIntegration) {
      toast.error('Nenhuma integração ativa encontrada');
      return;
    }

    await pagesDiscovery.mutateAsync({
      siteId,
      integrationId: activeIntegration.id,
      months: 16,
    });
  };

  const handleSitemapsProcess = async () => {
    await sitemapsProcess.mutateAsync({ siteId });
  };

  if (isLoadingStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handlePagesDiscovery}
          disabled={pagesDiscovery.isPending}
          className="gap-2"
        >
          {pagesDiscovery.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Descobrir Páginas GSC
        </Button>
        <Button
          onClick={handleSitemapsProcess}
          disabled={sitemapsProcess.isPending}
          variant="outline"
          className="gap-2"
        >
          {sitemapsProcess.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Processar Sitemaps
        </Button>
      </div>

      {/* Quota Warning Banner */}
      <GSCQuotaWarningBanner siteId={siteId} />
      
      {/* New: Alerts Dashboard */}
      <GSCAlertsDashboard siteId={siteId} />
      
      {/* Alerts Banner (Legacy) */}
      <GSCAlertsBanner alerts={aggregatedStats?.alerts} />
      
      {/* Quota Chart */}
      <GSCQuotaChart data={aggregatedStats?.quotaHistory} />

      {/* New: Discovered URLs Table */}
      <GSCDiscoveredUrlsTable siteId={siteId} />

      {/* New: Jobs History */}
      <GSCJobsHistory siteId={siteId} />
      
      {/* Activity Timeline */}
      {isLoadingActivity ? (
        <Skeleton className="h-[500px]" />
      ) : (
        <GSCActivityTimeline activities={activityTimeline} />
      )}
    </div>
  );
};

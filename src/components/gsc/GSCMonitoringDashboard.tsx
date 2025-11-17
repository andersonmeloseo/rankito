import { Skeleton } from '@/components/ui/skeleton';
import { GSCQuotaChart } from './GSCQuotaChart';
import { GSCActivityTimeline } from './GSCActivityTimeline';
import { GSCAlertsBanner } from './GSCAlertsBanner';
import { GSCQuotaWarningBanner } from './GSCQuotaWarningBanner';
import { useGSCMonitoring } from '@/hooks/useGSCMonitoring';
import { useGSCActivity } from '@/hooks/useGSCActivity';

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
      {/* Quota Warning Banner */}
      <GSCQuotaWarningBanner siteId={siteId} />
      
      {/* Alerts Banner */}
      <GSCAlertsBanner alerts={aggregatedStats?.alerts} />
      
      {/* Quota Chart */}
      <GSCQuotaChart data={aggregatedStats?.quotaHistory} />
      
      {/* Activity Timeline */}
      {isLoadingActivity ? (
        <Skeleton className="h-[500px]" />
      ) : (
        <GSCActivityTimeline activities={activityTimeline} />
      )}
    </div>
  );
};

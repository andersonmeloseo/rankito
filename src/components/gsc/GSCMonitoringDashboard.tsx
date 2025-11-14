import { Skeleton } from '@/components/ui/skeleton';
import { GSCMetricsCards } from './GSCMetricsCards';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
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
      
      {/* Metrics Cards */}
      <GSCMetricsCards stats={aggregatedStats} />
      
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

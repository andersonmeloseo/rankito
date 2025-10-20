import { Progress } from "@/components/ui/progress";
import { useSubscriptionUsage } from "@/hooks/useSubscriptionUsage";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionUsageProgressProps {
  userId: string;
  maxSites: number | null;
  maxPages: number | null;
}

export const SubscriptionUsageProgress = ({ 
  userId, 
  maxSites, 
  maxPages 
}: SubscriptionUsageProgressProps) => {
  const { data: usage, isLoading } = useSubscriptionUsage(userId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  if (!usage) return null;

  const isUnlimited = maxSites === null && maxPages === null;

  if (isUnlimited) {
    return (
      <div className="text-xs text-muted-foreground">
        Ilimitado ∞
      </div>
    );
  }

  const sitesPercent = maxSites ? (usage.sites / maxSites) * 100 : 0;
  const pagesPercent = maxPages ? (usage.avgPages / maxPages) * 100 : 0;

  return (
    <div className="space-y-2">
      {maxSites && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Sites</span>
            <span className="font-medium">{usage.sites}/{maxSites}</span>
          </div>
          <Progress 
            value={sitesPercent} 
            className="h-1.5"
          />
        </div>
      )}
      
      {maxPages && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Páginas (média)</span>
            <span className="font-medium">{usage.avgPages}/{maxPages}</span>
          </div>
          <Progress 
            value={pagesPercent}
            className="h-1.5"
          />
        </div>
      )}
    </div>
  );
};

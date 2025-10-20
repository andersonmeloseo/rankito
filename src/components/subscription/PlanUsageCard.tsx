import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Sparkles, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const PlanUsageCard = () => {
  const { data: limits, isLoading } = useSubscriptionLimits();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!limits) return null;

  if (limits.isUnlimited) {
    return (
      <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Plano {limits.plan?.name} (Ilimitado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você tem acesso ilimitado a todos os recursos!
          </p>
        </CardContent>
      </Card>
    );
  }

  const sitesProgress = ((limits.currentUsage.sitesCount / (limits.plan?.max_sites || 1)) * 100);
  const avgPagesPerSite = Object.values(limits.currentUsage.pagesPerSite).reduce((a, b) => a + b, 0) / 
    (Object.keys(limits.currentUsage.pagesPerSite).length || 1);
  const pagesProgress = ((avgPagesPerSite / (limits.plan?.max_pages_per_site || 1)) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso do Plano {limits.plan?.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Sites</span>
            <span className="font-semibold">
              {limits.currentUsage.sitesCount}/{limits.plan?.max_sites || 0}
            </span>
          </div>
          <Progress value={sitesProgress} className="h-2" />
          {limits.remainingSites !== null && limits.remainingSites <= 1 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Apenas {limits.remainingSites} site(s) disponível(is)
            </p>
          )}
        </div>

        {limits.plan?.max_pages_per_site && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Páginas (média por site)</span>
              <span className="font-semibold">
                {Math.round(avgPagesPerSite)}/{limits.plan?.max_pages_per_site}
              </span>
            </div>
            <Progress value={pagesProgress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

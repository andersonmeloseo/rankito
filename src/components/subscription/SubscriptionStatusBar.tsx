import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, Sparkles, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionStatusBarProps {
  compact?: boolean;
}

export const SubscriptionStatusBar = ({ compact = false }: SubscriptionStatusBarProps) => {
  const { data: limits, isLoading } = useSubscriptionLimits();

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!limits) return null;

  // Para planos ilimitados
  if (limits.isUnlimited) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-background rounded-lg border border-yellow-200 dark:from-yellow-950/20 dark:border-yellow-900">
        <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
        <span className="text-sm font-medium">
          Plano {limits.plan?.name} - Acesso Ilimitado
        </span>
        <Badge variant="outline" className="ml-auto">
          {limits.plan?.name}
        </Badge>
      </div>
    );
  }

  // Calcular progresso de sites
  const sitesCount = limits.currentUsage.sitesCount;
  const maxSites = limits.plan?.max_sites || 0;
  const sitesProgress = maxSites > 0 ? (sitesCount / maxSites) * 100 : 0;

  // Calcular média de páginas por site
  const pagesPerSite = Object.values(limits.currentUsage.pagesPerSite);
  const avgPages = pagesPerSite.length > 0 
    ? Math.round(pagesPerSite.reduce((a, b) => a + b, 0) / pagesPerSite.length)
    : 0;
  const maxPages = limits.plan?.max_pages_per_site || 0;
  const pagesProgress = maxPages > 0 ? (avgPages / maxPages) * 100 : 0;

  // Determinar cores baseadas no uso
  const getSitesColor = () => {
    if (sitesProgress >= 90) return "text-destructive";
    if (sitesProgress >= 70) return "text-orange-600 dark:text-orange-500";
    return "text-muted-foreground";
  };

  const getPagesColor = () => {
    if (pagesProgress >= 90) return "text-destructive";
    if (pagesProgress >= 70) return "text-orange-600 dark:text-orange-500";
    return "text-muted-foreground";
  };

  return (
    <div className="flex items-center gap-6 p-3 bg-muted/30 rounded-lg border">
      {/* Indicador de Sites */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <Globe className={`w-4 h-4 ${getSitesColor()}`} />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium">Sites</span>
            <span className={`text-xs font-semibold ${getSitesColor()}`}>
              {sitesCount}/{maxSites}
            </span>
          </div>
          <Progress value={sitesProgress} className="h-1.5" />
          {limits.remainingSites === 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 text-destructive" />
              <span className="text-xs text-destructive">Limite atingido</span>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de Páginas (se houver limite) */}
      {maxPages > 0 && (
        <div className="flex items-center gap-3 min-w-[200px]">
          <FileText className={`w-4 h-4 ${getPagesColor()}`} />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Páginas (média)</span>
              <span className={`text-xs font-semibold ${getPagesColor()}`}>
                {avgPages}/{maxPages}
              </span>
            </div>
            <Progress value={pagesProgress} className="h-1.5" />
          </div>
        </div>
      )}

      {/* Badge do Plano */}
      <Badge variant="outline" className="ml-auto">
        {limits.plan?.name}
      </Badge>
    </div>
  );
};

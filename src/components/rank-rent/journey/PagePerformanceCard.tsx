import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, TrendingUp, TrendingDown, Clock, MousePointerClick } from "lucide-react";
import { PagePerformanceData } from "@/hooks/useSessionAnalytics";
import { PageInsightExplanation } from "./pagePerformanceInsights";

interface PagePerformanceCardProps {
  pages: PagePerformanceData[];
  insight: PageInsightExplanation;
  icon: React.ReactNode;
}

export const PagePerformanceCard = ({ pages, insight, icon }: PagePerformanceCardProps) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'destructive':
        return 'border-red-500/20 bg-red-500/5';
      case 'secondary':
        return 'border-purple-500/20 bg-purple-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  const getIconColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'destructive':
        return 'text-red-600 dark:text-red-400';
      case 'secondary':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.length > 40 
        ? urlObj.pathname.substring(0, 40) + '...' 
        : urlObj.pathname || '/';
    } catch {
      return url.length > 40 ? url.substring(0, 40) + '...' : url;
    }
  };

  return (
    <Card className={`${getColorClasses(insight.color)} transition-all duration-200 hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`${getIconColorClasses(insight.color)}`}>
              {icon}
            </div>
            <CardTitle className="text-lg">{insight.title}</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md p-4 space-y-2">
                <div>
                  <p className="font-semibold mb-1">O que significa?</p>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Como interpretar:</p>
                  <p className="text-sm text-muted-foreground">{insight.interpretation}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Ação recomendada:</p>
                  <p className="text-sm text-muted-foreground">{insight.action}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge variant="outline" className="w-fit mt-2">
          {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
        </Badge>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma página nesta categoria no período selecionado
          </p>
        ) : (
          <div className="space-y-3">
            {pages.slice(0, 5).map((page, index) => (
              <div 
                key={`${page.page_url}-${index}`} 
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium truncate flex-1" title={page.page_url}>
                    {formatUrl(page.page_url)}
                  </p>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>{page.totalVisits} visitas</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{Math.floor(page.avgTimeOnPage / 60)}:{String(page.avgTimeOnPage % 60).padStart(2, '0')}min</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingDown className="h-3 w-3" />
                    <span>{page.bounceRate}% rejeição</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MousePointerClick className="h-3 w-3" />
                    <span>{page.conversions} conversões</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

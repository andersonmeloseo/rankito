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
import { pageMetricTooltips } from "./pageMetricTooltips";

interface PagePerformanceCardProps {
  pages: PagePerformanceData[];
  insight: PageInsightExplanation;
  icon: React.ReactNode;
  days: number;
}

interface MetricWithTooltipProps {
  icon: React.ReactNode;
  value: string;
  tooltip: {
    title: string;
    description: string;
    calculation: string;
    interpretation: string;
  };
}

const MetricWithTooltip = ({ icon, value, tooltip }: MetricWithTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 text-muted-foreground cursor-help hover:text-foreground transition-colors">
          {icon}
          <span>{value}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm p-3 space-y-2">
        <p className="font-semibold text-sm">{tooltip.title}</p>
        <p className="text-xs text-muted-foreground">{tooltip.description}</p>
        <p className="text-xs text-muted-foreground italic">📊 {tooltip.calculation}</p>
        <p className="text-xs text-primary/90 font-medium">💡 {tooltip.interpretation}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const PagePerformanceCard = ({ pages, insight, icon, days }: PagePerformanceCardProps) => {
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">
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
                className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm font-medium truncate flex-1 cursor-help hover:text-primary transition-colors">
                          {formatUrl(page.page_url)}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-lg p-3" side="top">
                        <p className="text-xs font-mono break-all">{page.page_url}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <MetricWithTooltip
                    icon={<TrendingUp className="h-3 w-3" />}
                    value={`${page.entries} ${page.entries === 1 ? 'entrada' : 'entradas'}`}
                    tooltip={pageMetricTooltips.entries}
                  />
                  <MetricWithTooltip
                    icon={<Clock className="h-3 w-3" />}
                    value={`${Math.floor(page.avgTimeOnPage / 60)}:${String(page.avgTimeOnPage % 60).padStart(2, '0')}min`}
                    tooltip={pageMetricTooltips.avgTime}
                  />
                  <MetricWithTooltip
                    icon={<TrendingDown className="h-3 w-3" />}
                    value={`${page.bounceRate}% rejeição`}
                    tooltip={pageMetricTooltips.bounceRate}
                  />
                  <MetricWithTooltip
                    icon={<MousePointerClick className="h-3 w-3" />}
                    value={`${page.conversions} conversões`}
                    tooltip={pageMetricTooltips.conversions}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  Últimos {days} dias • Bounce rate calculado sobre entradas
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

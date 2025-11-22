import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, AlertTriangle } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface LocationData {
  city: string;
  country: string;
  count: number;
}

interface ClickEventSummary {
  pageUrl: string;
  eventType: string;
  count: number;
  ctaText?: string;
}

interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
  pageCount: number;
  locations: LocationData[];
  avgDuration: number;
  avgTimePerPage: number;
  clickEvents: ClickEventSummary[];
}

interface SequenceInsightsProps {
  sequence: CommonSequence;
}

export const SequenceInsights = ({ sequence }: SequenceInsightsProps) => {
  // Calculate conversion rate (sessions with clicks)
  const totalClicks = sequence.clickEvents.reduce((acc, click) => acc + click.count, 0);
  const conversionRate = totalClicks > 0 ? (totalClicks / sequence.count) * 100 : 0;

  // Find most engaged page (highest time spent + most clicks)
  const pageEngagement = sequence.sequence.map(page => {
    const clicks = sequence.clickEvents.filter(c => c.pageUrl === page);
    const clickCount = clicks.reduce((acc, c) => acc + c.count, 0);
    return { page, clickCount };
  });
  const mostEngaged = pageEngagement.reduce((max, curr) => 
    curr.clickCount > max.clickCount ? curr : max, 
    { page: '', clickCount: 0 }
  );

  // Calculate drop-off (assuming exit page has highest drop-off)
  const exitPage = sequence.sequence[sequence.sequence.length - 1];
  const dropOffRate = ((sequence.count - totalClicks) / sequence.count) * 100;

  const formatPageName = (url: string) => {
    try {
      const path = new URL(url).pathname;
      if (path === '/') return 'Home';
      const segments = path.split('/').filter(Boolean);
      return segments[segments.length - 1] || 'Home';
    } catch {
      return url.split('/').pop() || url;
    }
  };

  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Insights desta Sequência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-muted-foreground">Taxa de Conversão:</span>
            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
              {conversionRate.toFixed(1)}%
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              ({totalClicks} cliques em {sequence.count} sessões)
            </span>
          </div>
        </div>

        {mostEngaged.clickCount > 0 && (
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Página Mais Engajada:</span>
              <span className="ml-2 font-semibold">
                {formatPageName(mostEngaged.page)}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">
                ({formatTime(Math.round(sequence.avgTimePerPage))} médio, {mostEngaged.clickCount} cliques)
              </span>
            </div>
          </div>
        )}

        {dropOffRate > 50 && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Principal Drop-off:</span>
              <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                {formatPageName(exitPage)}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">
                ({dropOffRate.toFixed(0)}% saem sem converter)
              </span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
          <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-muted-foreground">Duração Média Total:</span>
            <span className="ml-2 font-semibold">
              {formatTime(Math.round(sequence.avgDuration))}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              ({formatTime(Math.round(sequence.avgTimePerPage))} por página)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
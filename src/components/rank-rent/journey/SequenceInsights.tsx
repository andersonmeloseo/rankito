import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, AlertTriangle, Sparkles, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import type { CommonSequence } from "@/hooks/useSessionAnalytics";

interface SequenceInsightsProps {
  sequence: CommonSequence;
}

export const SequenceInsights = ({ sequence }: SequenceInsightsProps) => {
  // Calculate conversion rate (sessions with at least 1 click)
  const totalClicks = sequence.clickEvents.reduce((acc, click) => acc + click.count, 0);
  const conversionRate = sequence.count > 0 ? (sequence.sessionsWithClicks / sequence.count) * 100 : 0;

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

  // Automatic pattern detection
  const insights = [];

  // High conversion rate
  if (conversionRate > 30) {
    insights.push({
      type: 'success' as const,
      icon: Sparkles,
      title: 'Alto Engajamento',
      description: `Sequência com ${conversionRate.toFixed(1)}% de taxa de conversão - muito acima da média!`,
    });
  }

  // High drop-off
  if (dropOffRate > 70) {
    insights.push({
      type: 'warning' as const,
      icon: AlertTriangle,
      title: 'Alto Drop-off',
      description: `${dropOffRate.toFixed(0)}% dos usuários saem sem converter. Revise CTAs e velocidade da página.`,
    });
  }

  // Long session duration
  if (sequence.avgDuration > 180) {
    insights.push({
      type: 'info' as const,
      icon: Clock,
      title: 'Sessão Longa',
      description: `Usuários passam ${formatTime(Math.round(sequence.avgDuration))} nesta jornada - alto engajamento.`,
    });
  }

  // Multiple pages
  if (sequence.pageCount >= 5) {
    insights.push({
      type: 'info' as const,
      icon: Users,
      title: 'Jornada Complexa',
      description: `${sequence.pageCount} páginas visitadas - usuários explorando bastante o conteúdo.`,
    });
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Insights Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Automatic Insights */}
        {insights.length > 0 && (
          <div className="space-y-2 pb-3 border-b">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <insight.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  insight.type === 'success' ? 'text-green-600 dark:text-green-400' :
                  insight.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-blue-600 dark:text-blue-400'
                }`} />
                <div>
                  <div className="font-medium">{insight.title}</div>
                  <div className="text-xs text-muted-foreground">{insight.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Core Metrics */}
        <div className="flex items-start gap-2">
          <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-muted-foreground">Taxa de Conversão:</span>
            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
              {conversionRate.toFixed(1)}%
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              ({sequence.sessionsWithClicks} de {sequence.count} sessões)
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
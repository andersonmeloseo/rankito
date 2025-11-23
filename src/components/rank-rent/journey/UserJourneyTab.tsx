import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionMetrics } from "./SessionMetrics";
import { SessionsTable } from "./SessionsTable";
import { TopPagesAnalysis } from "./TopPagesAnalysis";
import { SessionCards } from "./SessionCards";
import { JourneyHeatmapGrid } from "./visualizations/JourneyHeatmapGrid";
import { JourneyFlowDiagram } from "./visualizations/JourneyFlowDiagram";
import { TemporalComparison } from "./insights/TemporalComparison";
import { useSessionAnalytics } from "@/hooks/useSessionAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BarChart3, Route, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserJourneyTabProps {
  siteId: string;
}

export const UserJourneyTab = ({ siteId }: UserJourneyTabProps) => {
  const { data: analytics, isLoading, error } = useSessionAnalytics(siteId, 30);
  const { data: previousAnalytics } = useSessionAnalytics(siteId, 60); // Para comparação

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados de jornada. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum dado de jornada disponível ainda. Aguarde as primeiras visitas.
        </AlertDescription>
      </Alert>
    );
  }

  // Heatmap data (hour x day)
  const heatmapData: Array<{ day: number; hour: number; count: number }> = [];
  analytics.commonSequences.forEach(seq => {
    if (seq.firstAccessTime) {
      const date = new Date(seq.firstAccessTime);
      const day = date.getDay();
      const hour = date.getHours();
      const existing = heatmapData.find(h => h.day === day && h.hour === hour);
      if (existing) {
        existing.count += seq.count;
      } else {
        heatmapData.push({ day, hour, count: seq.count });
      }
    }
  });

  // Flow connections
  const connectionMap = new Map<string, number>();
  analytics.commonSequences.forEach(seq => {
    for (let i = 0; i < seq.sequence.length - 1; i++) {
      const key = `${seq.sequence[i]}->${seq.sequence[i + 1]}`;
      connectionMap.set(key, (connectionMap.get(key) || 0) + seq.count);
    }
  });

  const flowConnections = Array.from(connectionMap.entries()).map(([key, count]) => {
    const [from, to] = key.split('->');
    return { from, to, count };
  }).sort((a, b) => b.count - a.count).slice(0, 20);

  const topPages = [...new Set(analytics.commonSequences.flatMap(s => s.sequence))].slice(0, 10);

  // Temporal comparison
  const currentMetrics = {
    sessions: analytics.metrics.totalSessions,
    conversions: analytics.commonSequences.reduce((acc, s) => acc + s.sessionsWithClicks, 0),
    avgDuration: analytics.metrics.avgDuration,
    bounceRate: analytics.metrics.bounceRate,
  };

  const previousMetrics = previousAnalytics ? {
    sessions: previousAnalytics.metrics.totalSessions,
    conversions: previousAnalytics.commonSequences.reduce((acc, s) => acc + s.sessionsWithClicks, 0),
    avgDuration: previousAnalytics.metrics.avgDuration,
    bounceRate: previousAnalytics.metrics.bounceRate,
  } : currentMetrics;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="sequences" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Sequências
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sessões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Metrics */}
          <SessionMetrics metrics={analytics.metrics} />

          {/* Temporal Comparison */}
          <TemporalComparison current={currentMetrics} previous={previousMetrics} />

          {/* Heatmap de Atividade */}
          <JourneyHeatmapGrid data={heatmapData} />

          {/* Flow Diagram */}
          <JourneyFlowDiagram connections={flowConnections} topPages={topPages} />

          {/* Top Pages Analysis */}
          <TopPagesAnalysis 
            entryPages={analytics.topEntryPages}
            exitPages={analytics.topExitPages}
          />
        </TabsContent>

        <TabsContent value="sequences" className="space-y-6 mt-6">
          <SessionCards siteId={siteId} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6 mt-6">
          <SessionsTable siteId={siteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

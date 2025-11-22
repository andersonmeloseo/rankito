import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionMetrics } from "./SessionMetrics";
import { SessionsTable } from "./SessionsTable";
import { TopPagesAnalysis } from "./TopPagesAnalysis";
import { CommonSequences } from "./CommonSequences";
import { JourneyConversionFunnel } from "./JourneyConversionFunnel";
import { useSessionAnalytics } from "@/hooks/useSessionAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserJourneyTabProps {
  siteId: string;
}

export const UserJourneyTab = ({ siteId }: UserJourneyTabProps) => {
  const { data: analytics, isLoading, error } = useSessionAnalytics(siteId, 30);

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

  return (
    <div className="space-y-6">
      <SessionMetrics metrics={analytics.metrics} />

      {/* Conversion Funnel - Only show if we have sequences */}
      {analytics.commonSequences.length > 0 && analytics.stepVolumes.size > 0 && (
        <JourneyConversionFunnel 
          sequence={analytics.commonSequences[0].sequence}
          stepVolumes={analytics.stepVolumes}
          totalSessions={analytics.metrics.totalSessions}
        />
      )}

      <Tabs defaultValue="sequences" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sequences">Sequências Comuns</TabsTrigger>
          <TabsTrigger value="pages">Análise de Páginas</TabsTrigger>
          <TabsTrigger value="sessions">Sessões Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="space-y-4">
          <CommonSequences sequences={analytics.commonSequences} />
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <TopPagesAnalysis 
            entryPages={analytics.topEntryPages}
            exitPages={analytics.topExitPages}
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionsTable siteId={siteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

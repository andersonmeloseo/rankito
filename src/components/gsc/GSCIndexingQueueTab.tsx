import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGSCIndexingQueue } from "@/hooks/useGSCIndexingQueue";
import { Clock, CheckCircle2, XCircle, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGSCIndexing } from "@/hooks/useGSCIndexing";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GSCIndexingQueueTabProps {
  siteId: string;
}

export function GSCIndexingQueueTab({ siteId }: GSCIndexingQueueTabProps) {
  const { queueItems, queueStats, isLoadingQueue } = useGSCIndexingQueue({ siteId });
  const { quota, resetAt } = useGSCIndexing({ siteId });

  if (isLoadingQueue) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {quota && quota.remaining === 0 && queueStats.pendingTomorrow > 0 && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Quota esgotada!</strong> {queueStats.pendingTomorrow} URLs reagendadas para amanhã.
            Reseta {resetAt ? formatDistanceToNow(new Date(resetAt), { locale: ptBR, addSuffix: true }) : 'em breve'}.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-blue-600">{queueStats.pendingToday}</p>
            <p className="text-sm text-muted-foreground">Para Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-orange-600">{queueStats.pendingTomorrow}</p>
            <p className="text-sm text-muted-foreground">Para Amanhã</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-purple-600">{queueStats.processing}</p>
            <p className="text-sm text-muted-foreground">Processando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{queueStats.completed}</p>
            <p className="text-sm text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
            <p className="text-sm text-muted-foreground">Falharam</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>URLs na Fila ({queueItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma URL na fila</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Total de {queueItems.length} URLs na fila de indexação
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

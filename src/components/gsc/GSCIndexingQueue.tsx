import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Clock, AlertCircle, CheckCircle2, XCircle, Loader2, Trash2, Info, Shuffle } from "lucide-react";
import { useState } from "react";
import { useGSCIndexingQueue } from "@/hooks/useGSCIndexingQueue";
import { useGSCQueueRebalance, type RebalancePreview } from "@/hooks/useGSCQueueRebalance";
import { GSCRebalancePreviewDialog } from "./GSCRebalancePreviewDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GSCIndexingQueueProps {
  siteId: string;
}

export const GSCIndexingQueue = ({ siteId }: GSCIndexingQueueProps) => {
  const { queueItems, batches, queueStats, isLoadingQueue, cancelBatch, removeFromQueue, clearAllPendingUrls } = useGSCIndexingQueue({ siteId });
  const { rebalanceQueue, isRebalancing, previewRebalance } = useGSCQueueRebalance(siteId);
  const [batchToCancel, setBatchToCancel] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<RebalancePreview | null>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendente", icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      processing: { label: "Processando", icon: Loader2, className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completo", icon: CheckCircle2, className: "bg-green-100 text-green-800" },
      failed: { label: "Falhou", icon: XCircle, className: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelado", icon: XCircle, className: "bg-gray-100 text-gray-800" },
    };

    const variant = variants[status as keyof typeof variants] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge variant="secondary" className={variant.className}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const groupByDate = () => {
    const grouped: Record<string, typeof queueItems> = {};
    queueItems.forEach(item => {
      if (!grouped[item.scheduled_for]) {
        grouped[item.scheduled_for] = [];
      }
      grouped[item.scheduled_for].push(item);
    });
    return grouped;
  };

  const groupedQueue = groupByDate();
  const sortedDates = Object.keys(groupedQueue).sort();

  if (isLoadingQueue) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Alert */}
      {queueStats.total > 100 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Exibição Limitada</AlertTitle>
          <AlertDescription>
            Exibindo os 100 itens mais recentes de {queueStats.total.toLocaleString()} na fila para melhor performance.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {queueStats.pending > 0 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => rebalanceQueue(siteId)}
            disabled={isRebalancing}
          >
            <Shuffle className="w-4 h-4 mr-2" />
            {isRebalancing ? 'Rebalanceando...' : 'Rebalancear Fila'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowClearAllDialog(true)}
            disabled={clearAllPendingUrls.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Fila Completa ({queueStats.pending} pendentes)
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{queueStats.total}</div>
            <p className="text-xs text-muted-foreground">Total na Fila</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{queueStats.pending}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{queueStats.processing}</div>
            <p className="text-xs text-muted-foreground">Processando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
            <p className="text-xs text-muted-foreground">Falharam</p>
          </CardContent>
        </Card>
      </div>

      {/* Batches Recentes */}
      {batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Batches de Indexação</CardTitle>
            <CardDescription>Histórico dos últimos batches processados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batches.map((batch) => {
                const progress = batch.total_urls > 0 
                  ? ((batch.completed_urls + batch.failed_urls) / batch.total_urls) * 100 
                  : 0;

                return (
                  <div key={batch.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Batch #{batch.id.slice(0, 8)}</span>
                          {getStatusBadge(batch.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(batch.created_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      {batch.status === 'processing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBatchToCancel(batch.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {batch.completed_urls + batch.failed_urls} / {batch.total_urls} URLs processadas
                        </span>
                        <div className="flex gap-4">
                          <span className="text-green-600">✓ {batch.completed_urls}</span>
                          <span className="text-red-600">✗ {batch.failed_urls}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fila por Data */}
      {sortedDates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>URLs Agendadas</CardTitle>
            <CardDescription>URLs organizadas por data de agendamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sortedDates.map((date) => {
                const items = groupedQueue[date];
                const pendingCount = items.filter(i => i.status === 'pending').length;

                return (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium">
                        {format(new Date(date + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </h3>
                      <Badge variant="outline">{items.length} URLs</Badge>
                      {pendingCount > 0 && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {pendingCount} pendentes
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 ml-7">
                      {items.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-mono text-xs">{item.url}</div>
                            {item.error_message && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                {item.error_message}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge(item.status)}
                            {item.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromQueue.mutate(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {items.length > 5 && (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          + {items.length - 5} URLs adicionais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma URL agendada na fila</p>
              <p className="text-sm mt-2">Use a seleção em massa para adicionar URLs à fila de indexação</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Batch Dialog */}
      <AlertDialog open={!!batchToCancel} onOpenChange={() => setBatchToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Batch?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá cancelar o batch e remover todas as URLs pendentes da fila. URLs já processadas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (batchToCancel) {
                  cancelBatch.mutate(batchToCancel);
                  setBatchToCancel(null);
                }
              }}
            >
              Sim, cancelar batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Limpar Fila de Indexação?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Isso irá remover <strong>TODAS as {queueStats.pending} URLs pendentes</strong> da fila de indexação.</p>
              <p className="text-destructive font-medium">Esta ação não pode ser desfeita.</p>
              <p className="text-muted-foreground text-sm">
                URLs que já estão sendo processadas ou completadas não serão afetadas.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAllPendingUrls.mutate();
                setShowClearAllDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, limpar fila ({queueStats.pending})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GSCRebalancePreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        preview={preview}
        onConfirm={() => {
          rebalanceQueue(siteId);
          setShowPreview(false);
        }}
        isRebalancing={isRebalancing}
      />
    </div>
  );
};

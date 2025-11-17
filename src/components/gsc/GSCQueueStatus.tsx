import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Activity, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useGSCQueueLogs } from "@/hooks/useGSCQueueLogs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GSCQueueStatusProps {
  siteId: string;
}

export function GSCQueueStatus({ siteId }: GSCQueueStatusProps) {
  const { latestLog, nextExecution, isLoading: isLoadingLogs } = useGSCQueueLogs();

  // Fetch pending URLs count
  const { data: pendingCount, isLoading: isLoadingPending } = useQuery({
    queryKey: ['gsc-queue-pending-count', siteId],
    queryFn: async () => {
      // Get integration IDs for this site
      const { data: integrations } = await supabase
        .from('google_search_console_integrations')
        .select('id')
        .eq('site_id', siteId);

      const integrationIds = integrations?.map(i => i.id) || [];

      if (integrationIds.length === 0) return 0;

      const { count, error } = await supabase
        .from('gsc_indexing_queue')
        .select('*', { count: 'exact', head: true })
        .in('integration_id', integrationIds)
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const isLoading = isLoadingLogs || isLoadingPending;

  // Calculate time until next execution
  const getTimeUntilNext = () => {
    if (!nextExecution) return null;
    const now = new Date();
    const diff = nextExecution.getTime() - now.getTime();
    
    if (diff <= 0) return "Processando agora";
    
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "menos de 1 minuto";
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Status da Fila de Processamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Last Execution */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Última Execução
              </div>
              {latestLog ? (
                <div className="space-y-2 pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(latestLog.executed_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {latestLog.execution_type === 'cron' ? 'Automático' : 'Manual'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">{latestLog.total_processed}</span>
                      <span className="text-muted-foreground">processadas</span>
                    </div>
                    {latestLog.total_failed > 0 && (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-700 font-medium">{latestLog.total_failed}</span>
                        <span className="text-muted-foreground">falharam</span>
                      </div>
                    )}
                    {latestLog.total_skipped > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-700 font-medium">{latestLog.total_skipped}</span>
                        <span className="text-muted-foreground">ignoradas</span>
                      </div>
                    )}
                  </div>
                  {latestLog.duration_ms && (
                    <div className="text-xs text-muted-foreground">
                      Duração: {(latestLog.duration_ms / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pl-6 italic">
                  Nenhuma execução registrada ainda
                </p>
              )}
            </div>

            {/* Next Execution */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
                Próximo Processamento
              </div>
              <div className="pl-6">
                {nextExecution ? (
                  <div className="space-y-1">
                    <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
                      Em {getTimeUntilNext()}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {nextExecution.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Aguardando primeira execução
                  </p>
                )}
              </div>
            </div>

            {/* Pending URLs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                URLs na Fila
              </div>
              <div className="pl-6">
                <Badge 
                  variant={pendingCount && pendingCount > 0 ? "default" : "outline"}
                  className={pendingCount && pendingCount > 0 ? "bg-yellow-500/10 text-yellow-700 border-yellow-200" : ""}
                >
                  {pendingCount || 0} URL{pendingCount !== 1 ? 's' : ''} aguardando
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

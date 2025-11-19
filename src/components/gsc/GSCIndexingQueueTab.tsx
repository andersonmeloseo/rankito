import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGSCIndexingQueue } from "@/hooks/useGSCIndexingQueue";
import { Clock, CheckCircle2, XCircle, Loader2, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGSCIndexing } from "@/hooks/useGSCIndexing";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo } from "react";

interface GSCIndexingQueueTabProps {
  siteId: string;
}

export function GSCIndexingQueueTab({ siteId }: GSCIndexingQueueTabProps) {
  const { queueItems, queueStats, isLoadingQueue } = useGSCIndexingQueue({ siteId });
  const { quota, resetAt } = useGSCIndexing({ siteId });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'failed': return <XCircle className="h-3 w-3 mr-1" />;
      case 'processing': return <Loader2 className="h-3 w-3 mr-1 animate-spin" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusLabel = (status: string): string => {
    const translations: Record<string, string> = {
      'pending': 'Pendente',
      'processing': 'Processando',
      'completed': 'Concluído',
      'failed': 'Falhou'
    };
    return translations[status] || status;
  };

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return queueItems.slice(startIndex, endIndex);
  }, [queueItems, currentPage, pageSize]);

  const totalPages = Math.ceil(queueItems.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, queueItems.length);

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
            <p className="text-2xl font-bold text-foreground">{queueStats.pendingToday}</p>
            <p className="text-sm text-muted-foreground">Para Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{queueStats.pendingTomorrow}</p>
            <p className="text-sm text-muted-foreground">Para Amanhã</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{queueStats.processing}</p>
            <p className="text-sm text-muted-foreground">Processando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{queueStats.completed}</p>
            <p className="text-sm text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{queueStats.failed}</p>
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
            <>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Agendado Para</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Tentativas</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-md truncate">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {item.url}
                          </a>
                        </TableCell>
                        <TableCell>
                    <Badge variant={getStatusVariant(item.status)}>
                      {getStatusIcon(item.status)}
                      {getStatusLabel(item.status)}
                    </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.scheduled_for), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(item.created_at), { locale: ptBR, addSuffix: true })}
                        </TableCell>
                        <TableCell>{item.attempts}</TableCell>
                        <TableCell>
                          {item.error_message && (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md">
                                <p className="text-xs">{item.error_message}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1}-{endIndex} de {queueItems.length}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

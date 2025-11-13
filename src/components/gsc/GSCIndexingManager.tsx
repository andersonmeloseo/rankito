import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGSCIndexing } from "@/hooks/useGSCIndexing";
import { useGSCIndexingQueue } from "@/hooks/useGSCIndexingQueue";
import { useGSCQueueLogs } from "@/hooks/useGSCQueueLogs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, ExternalLink, List, ChevronUp, ChevronDown, ChevronsUpDown, Zap, Activity } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { GSCBatchIndexingDialog } from "./GSCBatchIndexingDialog";
import { GSCIndexingQueue } from "./GSCIndexingQueue";

interface GSCIndexingManagerProps {
  siteId: string;
}

export function GSCIndexingManager({ siteId }: GSCIndexingManagerProps) {
  const [customUrl, setCustomUrl] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("page_path");
  const [sortColumn, setSortColumn] = useState<string>("page_path");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const PAGES_PER_PAGE = 50;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" 
      ? <ChevronUp className="w-4 h-4" /> 
      : <ChevronDown className="w-4 h-4" />;
  };

  const {
    quota,
    recentRequests,
    resetAt,
    isLoadingQuota,
    requestIndexing,
    isRequesting,
    refetchQuota,
  } = useGSCIndexing({ siteId });

  const { addToQueue, isAddingToQueue } = useGSCIndexingQueue({ siteId });
  const { latestLog, nextExecution, isLoading: isLoadingLogs } = useGSCQueueLogs();

  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Fetch site pages with pagination, search, and filters
  const { data: pagesData, isLoading: isLoadingPages } = useQuery({
    queryKey: ['site-pages', siteId, currentPage, searchTerm, statusFilter, sortBy],
    queryFn: async () => {
      const from = (currentPage - 1) * PAGES_PER_PAGE;
      const to = from + PAGES_PER_PAGE - 1;

      // Build query
      let countQuery = supabase
        .from('rank_rent_pages')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'active');

      let dataQuery = supabase
        .from('rank_rent_pages')
        .select('*')
        .eq('site_id', siteId)
        .eq('status', 'active');

      // Add search filter if present
      if (searchTerm) {
        countQuery = countQuery.ilike('page_path', `%${searchTerm}%`);
        dataQuery = dataQuery.ilike('page_path', `%${searchTerm}%`);
      }

      // Add status filter if not "all"
      if (statusFilter !== "all") {
        countQuery = countQuery.eq('gsc_indexation_status', statusFilter);
        dataQuery = dataQuery.eq('gsc_indexation_status', statusFilter);
      }

      // Add sorting
      const sortOptions: Record<string, { column: string; ascending: boolean }> = {
        'page_path': { column: 'page_path', ascending: true },
        'indexed_at_desc': { column: 'gsc_indexed_at', ascending: false },
        'indexed_at_asc': { column: 'gsc_indexed_at', ascending: true },
        'submitted_at_desc': { column: 'gsc_last_checked_at', ascending: false },
      };

      const sort = sortOptions[sortBy] || sortOptions['page_path'];
      dataQuery = dataQuery.order(sort.column, { ascending: sort.ascending, nullsFirst: false });
      dataQuery = dataQuery.range(from, to);

      const { count } = await countQuery;
      const { data, error } = await dataQuery;

      if (error) throw error;
      
      return { 
        pages: data || [], 
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / PAGES_PER_PAGE)
      };
    },
    enabled: !!siteId,
  });

  const pages = pagesData?.pages || [];

  // Apply client-side sorting
  const sortedPages = useMemo(() => {
    if (!pages || pages.length === 0) return [];
    
    return [...pages].sort((a, b) => {
      const aVal = a[sortColumn as keyof typeof a];
      const bVal = b[sortColumn as keyof typeof b];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [pages, sortColumn, sortDirection]);

  const handleIndexCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    await requestIndexing.mutateAsync({ url: customUrl.trim() });
    setCustomUrl("");
  };

  const handleIndexPage = async (pageId: string, pageUrl: string) => {
    await requestIndexing.mutateAsync({ url: pageUrl, page_id: pageId });
  };

  const handleToggleAll = () => {
    if (!sortedPages) return;
    
    if (selectedPages.size === sortedPages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(sortedPages.map(p => p.id)));
    }
  };

  const handleTogglePage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleBatchIndexing = async (distribution: 'fast' | 'even') => {
    if (!sortedPages) return;

    const selectedUrls = sortedPages
      .filter(p => selectedPages.has(p.id))
      .map(p => ({ url: p.page_url, page_id: p.id }));

    await addToQueue.mutateAsync({ urls: selectedUrls, distribution });
    setSelectedPages(new Set());
    setShowBatchDialog(false);
  };

  const handleProcessQueueNow = async () => {
    setIsProcessingQueue(true);
    try {
      const { data, error } = await supabase.functions.invoke('gsc-process-indexing-queue', {
        body: { scheduled: false }
      });

      if (error) throw error;

      toast.success(`✅ Fila processada! ${data.total_processed} URLs enviadas ao Google`);
      refetchQuota();
    } catch (error) {
      toast.error("Erro ao processar fila", {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const getGSCStatusBadge = (status: string | null) => {
    if (status === 'indexed') {
      return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
        <CheckCircle2 className="h-3 w-3 mr-1" />Indexado
      </Badge>;
    }
    if (status === 'submitted') {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
        <Clock className="h-3 w-3 mr-1" />Enviado
      </Badge>;
    }
    if (status === 'error') {
      return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
        <XCircle className="h-3 w-3 mr-1" />Erro
      </Badge>;
    }
    return <Badge variant="outline" className="border-gray-300 text-gray-600">
      <AlertTriangle className="h-3 w-3 mr-1" />Não Enviado
    </Badge>;
  };

  const getStatusBadge = (status: string, errorMessage: string | null) => {
    if (status === 'success') {
      return <Badge variant="outline" className="border-green-500 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Sucesso</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
    return (
      <Badge variant="destructive" title={errorMessage || undefined}>
        <XCircle className="h-3 w-3 mr-1" />Erro
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getQuotaColor = () => {
    if (!quota) return "bg-gray-500";
    if (quota.percentage >= 90) return "bg-red-500";
    if (quota.percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoadingQuota) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-[400px] w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quota Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Indexação Instantânea
              </CardTitle>
              <CardDescription className="mt-2">
                Solicite a indexação de URLs diretamente ao Google Search Console
                {quota && ` (quota agregada: ${quota.limit} URLs/dia)`}
              </CardDescription>
              {quota && quota.unhealthy_count && quota.unhealthy_count > 0 && (
                <Badge variant="destructive" className="mt-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {quota.unhealthy_count} integração(ões) temporariamente indisponível(is)
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchQuota()}
              disabled={isLoadingQuota}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingQuota ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {quota && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Quota Diária</p>
                  <p className="text-2xl font-bold">
                    {quota.used} / {quota.limit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {quota.remaining} URLs restantes hoje
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={quota.remaining > 0 ? "outline" : "destructive"} className="text-lg px-4 py-2">
                    {quota.percentage}%
                  </Badge>
                  {resetAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Renova em: {formatDate(resetAt)}
                    </p>
                  )}
                </div>
              </div>
              <Progress value={quota.percentage} className={`h-3 ${getQuotaColor()}`} />
              
              {quota.remaining === 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Limite diário atingido. A quota será renovada automaticamente às 00:00 UTC.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Index Custom URL */}
      <Card>
        <CardHeader>
          <CardTitle>Indexar URL Customizada</CardTitle>
          <CardDescription>
            Envie qualquer URL para indexação no Google Search Console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIndexCustomUrl} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-url">URL Completa</Label>
              <Input
                id="custom-url"
                type="url"
                placeholder="https://exemplo.com/pagina"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                disabled={isRequesting || quota?.remaining === 0}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="submit" 
                disabled={isRequesting || !customUrl.trim() || quota?.remaining === 0}
              >
                {isRequesting ? "Enviando..." : "Solicitar Indexação"}
              </Button>
              <Button
                type="button"
                onClick={handleProcessQueueNow}
                disabled={isProcessingQueue}
                variant="outline"
                className="gap-2"
              >
                {isProcessingQueue ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Processar Fila Agora
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Last Execution Info */}
      {latestLog && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            <div className="font-medium">
              Última execução automática: {formatDistanceToNow(new Date(latestLog.executed_at), { addSuffix: true, locale: ptBR })}
            </div>
            <div className="text-sm text-muted-foreground">
              📊 {latestLog.total_processed} URLs processadas
              {nextExecution && ` • Próxima execução: ${formatDistanceToNow(nextExecution, { addSuffix: true, locale: ptBR })}`}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Site Pages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Páginas do Site</CardTitle>
              <CardDescription>
                Selecione páginas para indexação em lote ou individual
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {selectedPages.size > 0 && (
                <>
                  <Badge variant="secondary" className="text-sm px-3 py-1.5">
                    {selectedPages.size} de {sortedPages.length} páginas selecionadas
                  </Badge>
                  <Button
                    onClick={() => setShowBatchDialog(true)}
                    disabled={quota?.remaining === 0}
                    size="sm"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Indexar Selecionadas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPages(new Set())}
                  >
                    Limpar Seleção
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Buscar por URL ou título..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md flex-1"
            />
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos os Status</option>
              <option value="not_submitted">Não Enviado</option>
              <option value="submitted">Enviado</option>
              <option value="indexed">Indexado</option>
              <option value="error">Erro</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="page_path">URL (A-Z)</option>
              <option value="indexed_at_desc">Indexado (Mais Recente)</option>
              <option value="indexed_at_asc">Indexado (Mais Antigo)</option>
              <option value="submitted_at_desc">Enviado (Mais Recente)</option>
            </select>

            {(searchTerm || statusFilter !== "all" || sortBy !== "page_path") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSortBy("page_path");
                  setCurrentPage(1);
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
          {isLoadingPages ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : sortedPages.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={sortedPages.length > 0 && selectedPages.size === sortedPages.length}
                            onCheckedChange={handleToggleAll}
                            title={`${selectedPages.size === sortedPages.length ? 'Desmarcar' : 'Selecionar'} todas as ${sortedPages.length} páginas`}
                          />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="min-w-[300px] cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("page_path")}
                      >
                        <div className="flex items-center gap-2">
                          Página
                          <SortIcon column="page_path" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("page_url")}
                      >
                        <div className="flex items-center gap-2">
                          URL
                          <SortIcon column="page_url" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="min-w-[140px] cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("gsc_indexation_status")}
                      >
                        <div className="flex items-center gap-2">
                          Status GSC
                          <SortIcon column="gsc_indexation_status" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPages.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPages.has(page.id)}
                            onCheckedChange={() => handleTogglePage(page.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {page.page_title || page.page_path}
                        </TableCell>
                        <TableCell>
                          <a
                            href={page.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            {page.page_path}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          {getGSCStatusBadge(page.gsc_indexation_status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIndexPage(page.id, page.page_url)}
                            disabled={isRequesting || quota?.remaining === 0}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Indexar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {pagesData && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * PAGES_PER_PAGE) + 1} a {Math.min(currentPage * PAGES_PER_PAGE, pagesData.totalCount)} de {pagesData.totalCount.toLocaleString()} páginas
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {pagesData.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(pagesData.totalPages, p + 1))}
                      disabled={currentPage === pagesData.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertDescription>
                {searchTerm ? "Nenhuma página encontrada para esta busca" : "Nenhuma página ativa encontrada neste site. Importe o sitemap primeiro."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      {recentRequests && recentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico Recente</CardTitle>
            <CardDescription>
              Últimas 10 solicitações de indexação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium text-sm">
                        <a
                          href={request.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {request.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status, request.error_message)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(request.submitted_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fila de Indexação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="w-5 h-5" />
            Fila de Indexação
          </CardTitle>
          <CardDescription>
            URLs agendadas para processamento automático
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GSCIndexingQueue siteId={siteId} />
        </CardContent>
      </Card>

      {/* Batch Indexing Dialog */}
      <GSCBatchIndexingDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        selectedUrls={sortedPages?.filter(p => selectedPages.has(p.id)).map(p => ({ url: p.page_url, page_id: p.id })) || []}
        remainingQuota={quota?.remaining || 0}
        totalLimit={quota?.limit || 200}
        onConfirm={handleBatchIndexing}
        isSubmitting={isAddingToQueue}
      />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useGSCIndexing } from "@/hooks/useGSCIndexing";
import { GSCIndexingHistory } from "./GSCIndexingHistory";
import { GSCSimpleBatchDialog } from "./GSCSimpleBatchDialog";
import { PageTableFilters } from "@/components/reports/PageTableFilters";
import { RefreshCw, Activity, Info, ChevronLeft, ChevronRight, ExternalLink, Send, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GSCIndexingManagerProps {
  siteId: string;
}

export function GSCIndexingManager({ siteId }: GSCIndexingManagerProps) {
  const { quota, resetAt, refetchQuota, isLoadingQuota } = useGSCIndexing({ siteId });
  
  // States for URL table
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  // Fetch site pages with GSC status
  const { data: pagesData, isLoading: isLoadingPages } = useQuery({
    queryKey: ['site-pages-gsc', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_pages')
        .select(`
          id, 
          page_url, 
          page_path,
          page_title,
          gsc_indexing_queue!left(status, processed_at),
          gsc_url_indexing_requests!left(status, submitted_at)
        `)
        .eq('site_id', siteId)
        .order('page_path');
      
      if (error) throw error;
      
      // Transform data to include latest status and submission
      return (data || []).map(page => {
        const queueStatus = Array.isArray(page.gsc_indexing_queue) && page.gsc_indexing_queue.length > 0 
          ? page.gsc_indexing_queue[0].status 
          : null;
        const queueProcessedAt = Array.isArray(page.gsc_indexing_queue) && page.gsc_indexing_queue.length > 0
          ? page.gsc_indexing_queue[0].processed_at
          : null;
        
        const requests = Array.isArray(page.gsc_url_indexing_requests) 
          ? page.gsc_url_indexing_requests 
          : [];
        const latestRequest = requests.sort((a, b) => 
          new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
        )[0];
        
        const requestStatus = latestRequest?.status;
        const submittedAt = latestRequest?.submitted_at || queueProcessedAt;
        
        // Determine final status (prefer request status over queue status)
        const finalStatus = requestStatus || queueStatus || 'not_submitted';
        
        return {
          id: page.id,
          page_url: page.page_url,
          page_path: page.page_path,
          page_title: page.page_title,
          gsc_status: finalStatus,
          last_submission: submittedAt,
        };
      });
    },
  });

  // Filter and paginate pages
  const filteredPages = useMemo(() => {
    if (!pagesData) return [];
    if (!searchTerm) return pagesData;
    
    const search = searchTerm.toLowerCase();
    return pagesData.filter(page => 
      page.page_url.toLowerCase().includes(search) ||
      page.page_path.toLowerCase().includes(search)
    );
  }, [pagesData, searchTerm]);

  const paginatedPages = useMemo(() => {
    if (pageSize === 999999) return filteredPages;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPages.slice(startIndex, endIndex);
  }, [filteredPages, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPages.length / pageSize);

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleToggleAll = () => {
    if (pageSize === 999999) {
      // Todas as páginas
      if (selectedPages.size === filteredPages.length) {
        setSelectedPages(new Set());
      } else {
        setSelectedPages(new Set(filteredPages.map(p => p.page_url)));
      }
    } else {
      // Apenas página atual
      const currentUrls = paginatedPages.map(p => p.page_url);
      const allCurrentSelected = currentUrls.every(url => selectedPages.has(url));
      
      const newSelected = new Set(selectedPages);
      if (allCurrentSelected) {
        currentUrls.forEach(url => newSelected.delete(url));
      } else {
        currentUrls.forEach(url => newSelected.add(url));
      }
      setSelectedPages(newSelected);
    }
  };

  const handleTogglePage = (url: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedPages(newSelected);
  };

  const handleIndexSelected = () => {
    if (selectedPages.size === 0) {
      toast.error("Selecione pelo menos uma URL para indexar");
      return;
    }
    setShowBatchDialog(true);
  };

  const handleIndexSingle = (url: string) => {
    setSelectedPages(new Set([url]));
    setShowBatchDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'indexed':
        return (
          <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Indexado
          </Badge>
        );
      case 'failed':
      case 'error':
        return (
          <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200">
            <Activity className="h-3 w-3 mr-1" />
            Processando
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Info className="h-3 w-3 mr-1" />
            Não Submetido
          </Badge>
        );
    }
  };

  const getQuotaColorClass = () => {
    if (!quota) return "bg-gray-500";
    const remaining = quota.remaining;
    if (remaining > 100) return "bg-green-500 text-white";
    if (remaining > 50) return "bg-yellow-500 text-white";
    if (remaining > 0) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <div className="space-y-8">
      {/* Card Simples de Quota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quota Disponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingQuota ? (
            <Skeleton className="h-16" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getQuotaColorClass()}>
                    {quota?.remaining || 0} URLs disponíveis hoje
                  </Badge>
                  {quota && (
                    <span className="text-sm text-muted-foreground">
                      {quota.used} / {quota.limit} usadas
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchQuota()}
                  disabled={isLoadingQuota}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
              
              {resetAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  Reseta em {formatDistanceToNow(new Date(resetAt), { locale: ptBR, addSuffix: true })}
                </p>
              )}

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Como indexar páginas:</strong> Vá para a aba "Páginas do Site", 
                  selecione as páginas desejadas e use a ação em lote "Indexar no GSC". 
                  A fila é processada automaticamente a cada 30 minutos.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabela de URLs para Indexar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Páginas para Indexar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros */}
      {/* Filtros e Botão de Ação */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <PageTableFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            totalResults={pagesData?.length || 0}
            filteredResults={filteredPages.length}
          />
        </div>
        <Button
          onClick={handleIndexSelected}
          disabled={selectedPages.size === 0}
          className="shrink-0"
        >
          Indexar no GSC
        </Button>
      </div>

            {isLoadingPages ? (
              <Skeleton className="h-64" />
            ) : filteredPages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhuma URL encontrada" : "Nenhuma página disponível"}
              </div>
            ) : (
              <>
                {/* Tabela */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            pageSize === 999999
                              ? selectedPages.size === filteredPages.length && filteredPages.length > 0
                              : paginatedPages.every(p => selectedPages.has(p.page_url)) && paginatedPages.length > 0
                          }
                          onCheckedChange={handleToggleAll}
                        />
                      </TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Status GSC</TableHead>
                      <TableHead>Última Submissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPages.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPages.has(page.page_url)}
                            onCheckedChange={() => handleTogglePage(page.page_url)}
                          />
                        </TableCell>
                        <TableCell>
                          <a 
                            href={page.page_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm transition-colors"
                          >
                            {page.page_path}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell className="text-sm">
                          {page.page_title || <span className="text-muted-foreground italic">Sem título</span>}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(page.gsc_status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {page.last_submission 
                            ? formatDistanceToNow(new Date(page.last_submission), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })
                            : <span className="italic">Nunca</span>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleIndexSingle(page.page_url)}
                            className="h-8"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Indexar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

          {/* Contador de selecionadas */}
          <div className="pt-4">
            <span className="text-sm text-muted-foreground">
              {selectedPages.size} {selectedPages.size === 1 ? 'selecionada' : 'selecionadas'}
            </span>
          </div>

                {/* Paginação */}
                {pageSize !== 999999 && totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico com TODOS os Filtros */}
      <GSCIndexingHistory siteId={siteId} />

      {/* Dialog de Batch Indexing */}
      {showBatchDialog && (
        <GSCSimpleBatchDialog
          isOpen={showBatchDialog}
          onClose={() => {
            setShowBatchDialog(false);
            setSelectedPages(new Set());
          }}
          selectedUrls={Array.from(selectedPages)}
          siteId={siteId}
        />
      )}
    </div>
  );
}

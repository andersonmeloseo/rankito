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
import { GSCPageTableFilters } from "./GSCPageTableFilters";
import { RefreshCw, Activity, Info, ChevronLeft, ChevronRight, ExternalLink, Send, CheckCircle2, XCircle, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  const [sortField, setSortField] = useState<'page_path' | 'page_title' | 'gsc_status' | 'last_submission' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [integrationFilter, setIntegrationFilter] = useState<string | null>(null);

  // Buscar integrações GSC do projeto
  const { data: integrations = [] } = useQuery({
    queryKey: ["gsc-integrations", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_search_console_integrations")
        .select("id, connection_name, google_email")
        .eq("site_id", siteId)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
  });

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
          gsc_url_indexing_requests!left(status, submitted_at, integration_id)
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
        const integrationId = latestRequest?.integration_id;
        
        // Determine final status (prefer request status over queue status)
        const finalStatus = requestStatus || queueStatus || 'not_submitted';
        
        return {
          id: page.id,
          page_url: page.page_url,
          page_path: page.page_path,
          page_title: page.page_title,
          gsc_status: finalStatus,
          last_submission: submittedAt,
          gsc_integration_used: integrationId,
        };
      });
    },
  });

  // Filter and sort pages
  const filteredPages = useMemo(() => {
    if (!pagesData) return [];
    
    let result = pagesData;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(page => 
        page.page_url.toLowerCase().includes(search) ||
        (page.page_title && page.page_title.toLowerCase().includes(search))
      );
    }
    
    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter(page => {
        const status = page.gsc_status || 'not_submitted';
        return statusFilter.includes(status);
      });
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(page => {
        if (!page.last_submission) {
          return dateFilter === 'never';
        }
        
        if (dateFilter === 'never') {
          return false;
        }
        
        const submissionDate = new Date(page.last_submission);
        const hoursDiff = (now.getTime() - submissionDate.getTime()) / (1000 * 60 * 60);
        
        switch(dateFilter) {
          case '24h': return hoursDiff <= 24;
          case '7d': return hoursDiff <= 168;
          case '30d': return hoursDiff <= 720;
          default: return true;
        }
      });
    }
    
    // Apply integration filter
    if (integrationFilter) {
      result = result.filter(page => 
        page.gsc_integration_used === integrationFilter
      );
    }
    
    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle null/undefined
        if (!aValue) aValue = '';
        if (!bValue) bValue = '';
        
        // Convert to string for comparison
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        // Compare
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }
    
    return result;
  }, [pagesData, searchTerm, statusFilter, dateFilter, integrationFilter, sortField, sortDirection]);

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

  const handleSort = (field: 'page_path' | 'page_title' | 'gsc_status' | 'last_submission') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
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
      <div className="space-y-4">
        <GSCPageTableFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          integrationFilter={integrationFilter}
          onIntegrationFilterChange={setIntegrationFilter}
          totalResults={pagesData?.length || 0}
          filteredResults={filteredPages.length}
          integrations={integrations}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleIndexSelected}
            disabled={selectedPages.size === 0}
          >
            Indexar no GSC
          </Button>
        </div>
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
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('page_path')}
                      >
                        <div className="flex items-center">
                          URL
                          {getSortIcon('page_path')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('page_title')}
                      >
                        <div className="flex items-center">
                          Título
                          {getSortIcon('page_title')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('gsc_status')}
                      >
                        <div className="flex items-center">
                          Status GSC
                          {getSortIcon('gsc_status')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('last_submission')}
                      >
                        <div className="flex items-center">
                          Última Submissão
                          {getSortIcon('last_submission')}
                        </div>
                      </TableHead>
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

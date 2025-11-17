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
import { RefreshCw, Activity, Info, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Fetch site pages
  const { data: pagesData, isLoading: isLoadingPages } = useQuery({
    queryKey: ['site-pages', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_pages')
        .select('id, page_url, page_path')
        .eq('site_id', siteId)
        .order('page_path');
      
      if (error) throw error;
      return data || [];
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
      toast.error("Selecione pelo menos uma URL");
      return;
    }
    setShowBatchDialog(true);
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
            <PageTableFilters
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalResults={pagesData?.length || 0}
              filteredResults={filteredPages.length}
            />

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
                            paginatedPages.length > 0 && 
                            paginatedPages.every(p => selectedPages.has(p.page_url))
                          }
                          onCheckedChange={handleToggleAll}
                        />
                      </TableHead>
                      <TableHead>URL</TableHead>
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
                        <TableCell className="font-mono text-sm">
                          {page.page_path}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Footer com contador e botão */}
                <div className="flex justify-between items-center pt-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedPages.size} {selectedPages.size === 1 ? 'selecionada' : 'selecionadas'}
                  </span>
                  <Button
                    onClick={handleIndexSelected}
                    disabled={selectedPages.size === 0}
                  >
                    🚀 Indexar no GSC
                  </Button>
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

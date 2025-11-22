import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, ExternalLink, Globe, CheckCircle2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from '@/components/ui/pagination';
import { toast } from 'sonner';

interface IndexNowDiscoveredUrlsProps {
  siteId: string;
}

type SortField = 'url' | 'current_status' | 'sent_to_indexnow' | 'discovered_at';
type SortDirection = 'asc' | 'desc';
interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentSort: SortState;
  onSort: (field: SortField) => void;
  className?: string;
}

const SortableHeader = ({ field, label, currentSort, onSort, className }: SortableHeaderProps) => {
  const isActive = currentSort.field === field;
  return (
    <TableHead 
      className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${className || ''}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        {isActive && (currentSort.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
        {!isActive && <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
      </div>
    </TableHead>
  );
};

export const IndexNowDiscoveredUrls = ({ siteId }: IndexNowDiscoveredUrlsProps) => {
  const queryClient = useQueryClient();
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  
  const [sortState, setSortState] = useState<SortState>({
    field: 'discovered_at',
    direction: 'desc'
  });
  
  const [filters, setFilters] = useState({
    status: 'all',
    sentToIndexNow: 'all'
  });

  // Query 1: Total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['gsc-discovered-urls-count', siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Query 2: Paginated URLs (server-side pagination)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;

  const { data: urls, isLoading } = useQuery({
    queryKey: ['gsc-discovered-urls-indexnow', siteId, currentPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_discovered_urls')
        .select('id, url, current_status, discovered_at, sent_to_indexnow')
        .eq('site_id', siteId)
        .range(0, 9999999); // Fetch all for client-side processing
      
      if (error) throw error;
      return data;
    },
  });
  
  // Client-side filtering and sorting
  const sortData = <T extends Record<string, any>>(data: T[], sortState: SortState): T[] => {
    return [...data].sort((a, b) => {
      const aVal = a[sortState.field];
      const bVal = b[sortState.field];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'string') {
        return sortState.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'boolean') {
        return sortState.direction === 'asc' ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }
      return sortState.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal > bVal ? -1 : 1);
    });
  };
  
  const filterData = (data: any[]) => {
    return data.filter(item => {
      if (filters.status !== 'all' && item.current_status !== filters.status) return false;
      if (filters.sentToIndexNow === 'yes' && !item.sent_to_indexnow) return false;
      if (filters.sentToIndexNow === 'no' && item.sent_to_indexnow) return false;
      return true;
    });
  };
  
  const processedUrls = useMemo(() => {
    if (!urls) return [];
    const filtered = filterData(urls);
    return sortData(filtered, sortState);
  }, [urls, filters, sortState]);
  
  const paginatedUrls = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return processedUrls.slice(start, end);
  }, [processedUrls, currentPage, itemsPerPage]);

  // Query 3: Already sent count
  const { data: alreadySentCount = 0 } = useQuery({
    queryKey: ['gsc-discovered-urls-sent-count', siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('sent_to_indexnow', true);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const totalPages = Math.ceil(processedUrls.length / itemsPerPage);
  
  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sendToIndexNow = useMutation({
    mutationFn: async (urlList: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('indexnow-submit', {
        body: {
          urls: urlList,
          siteId,
          userId: user.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.urlsCount} URLs enviadas ao IndexNow`);
      setSelectedUrls([]);
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls-indexnow', siteId] });
      queryClient.invalidateQueries({ queryKey: ['indexnow-submissions', siteId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar URLs: ${error.message}`);
    },
  });

  const toggleUrl = (url: string) => {
    setSelectedUrls(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleAll = useMemo(() => {
    return () => {
      const currentPageUrls = paginatedUrls.map(u => u.url);
      const allSelected = currentPageUrls.every(url => selectedUrls.includes(url));
      
      if (allSelected && currentPageUrls.length > 0) {
        setSelectedUrls(prev => prev.filter(url => !currentPageUrls.includes(url)));
      } else {
        setSelectedUrls(prev => [...new Set([...prev, ...currentPageUrls])]);
      }
    };
  }, [paginatedUrls, selectedUrls]);

  const selectAllFiltered = () => {
    const allFilteredUrls = processedUrls.map(u => u.url);
    setSelectedUrls(allFilteredUrls);
    toast.success(`${allFilteredUrls.length} URLs selecionadas`);
  };

  const clearSelection = () => {
    setSelectedUrls([]);
    toast.success('Seleção limpa');
  };

  const handleSend = () => {
    if (selectedUrls.length === 0) {
      toast.error('Selecione ao menos uma URL');
      return;
    }
    sendToIndexNow.mutate(selectedUrls);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Descobertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{processedUrls.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selecionadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{selectedUrls.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Já Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{alreadySentCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URLs Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>URLs Descobertas Disponíveis</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, processedUrls.length)} de {processedUrls.length} URLs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={selectAllFiltered}
                disabled={processedUrls.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Selecionar Todas ({processedUrls.length})
              </Button>
              
              {selectedUrls.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearSelection}
                >
                  Limpar ({selectedUrls.length})
                </Button>
              )}
              
              <Button
                onClick={handleSend}
                disabled={selectedUrls.length === 0 || sendToIndexNow.isPending}
              >
                <Send className={`h-4 w-4 mr-2 ${sendToIndexNow.isPending ? 'animate-spin' : ''}`} />
                Enviar ao IndexNow
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="discovered">Descoberto</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Enviado ao IndexNow:</label>
              <Select
                value={filters.sentToIndexNow}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sentToIndexNow: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filters.status !== 'all' || filters.sentToIndexNow !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ status: 'all', sentToIndexNow: 'all' })}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
          

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedUrls.length > 0 && paginatedUrls.every(u => selectedUrls.includes(u.url))}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <SortableHeader 
                    field="url" 
                    label="URL" 
                    currentSort={sortState} 
                    onSort={handleSort} 
                  />
                  <SortableHeader 
                    field="current_status" 
                    label="Status" 
                    currentSort={sortState} 
                    onSort={handleSort} 
                  />
                  <SortableHeader 
                    field="sent_to_indexnow" 
                    label="IndexNow" 
                    currentSort={sortState} 
                    onSort={handleSort} 
                  />
                  <SortableHeader 
                    field="discovered_at" 
                    label="Descoberta em" 
                    currentSort={sortState} 
                    onSort={handleSort} 
                  />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUrls && paginatedUrls.length > 0 ? (
              paginatedUrls.map((url) => (
                    <TableRow key={url.id} className="h-16">
                      <TableCell>
                        <Checkbox
                          checked={selectedUrls.includes(url.url)}
                          onCheckedChange={() => toggleUrl(url.url)}
                        />
                      </TableCell>
                      <TableCell className="max-w-md">
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <span className="truncate">{url.url}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{url.current_status || 'Descoberto'}</Badge>
                      </TableCell>
                      <TableCell>
                        {url.sent_to_indexnow ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="outline">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {url.discovered_at 
                          ? new Date(url.discovered_at).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma URL descoberta ainda. Importe um sitemap para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && <PaginationEllipsis />}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
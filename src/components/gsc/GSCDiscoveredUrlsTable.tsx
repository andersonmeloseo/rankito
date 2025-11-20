import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGSCDiscoveredUrls } from '@/hooks/useGSCDiscoveredUrls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  FileText, 
  CheckCircle, 
  List, 
  AlertCircle, 
  History, 
  Send,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GSCDiscoveredUrlsTableProps {
  siteId: string;
}

type SortField = 'url' | 'current_status' | 'impressions' | 'clicks' | 'ctr' | 'position' | 'last_seen_at';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

export const GSCDiscoveredUrlsTable = ({ siteId }: GSCDiscoveredUrlsTableProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [urlsSort, setUrlsSort] = useState<SortState>({ field: 'last_seen_at', direction: 'desc' });
  const [historySort, setHistorySort] = useState<SortState>({ field: 'created_at' as any, direction: 'desc' });
  const [urlsFilters, setUrlsFilters] = useState({
    status: 'all',
    origin: 'all',
    hasClicks: 'all'
  });
  const [historyFilters, setHistoryFilters] = useState({
    status: 'all',
    hasErrors: 'all'
  });

  const pageSize = 100;

  const { urls, isLoading, totalCount, totalPages } = useGSCDiscoveredUrls(siteId, {
    status: statusFilter,
    searchTerm,
    page: currentPage,
    pageSize,
  });

  const { data: indexingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['gsc-indexing-jobs', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_indexing_jobs')
        .select('*')
        .eq('site_id', siteId)
        .eq('job_type', 'instant_indexing')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const queryClient = useQueryClient();

  const sendToIndexing = useMutation({
    mutationFn: async (urlIds: string[]) => {
      const selectedUrlsData = urls?.filter(u => urlIds.includes(u.id)) || [];
      const { data, error } = await supabase.functions.invoke('gsc-instant-index', {
        body: { 
          siteId, 
          urls: selectedUrlsData.map(u => u.url) 
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.successful || 0} URLs enviadas para indexação`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-jobs'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar URLs: ${error.message}`);
    }
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const handleUrlsSort = (field: SortField) => {
    setUrlsSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleHistorySort = (field: string) => {
    setHistorySort(prev => ({
      field: field as any,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortData = <T extends Record<string, any>>(data: T[], sortState: SortState): T[] => {
    return [...data].sort((a, b) => {
      const aVal = a[sortState.field];
      const bVal = b[sortState.field];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'string') {
        return sortState.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const filterUrlsData = (data: any[]) => {
    return data.filter(item => {
      if (urlsFilters.status !== 'all' && item.current_status !== urlsFilters.status) return false;
      if (urlsFilters.origin === 'gsc' && !item.gsc_data) return false;
      if (urlsFilters.origin === 'sitemap' && !item.indexnow_data) return false;
      if (urlsFilters.origin === 'both' && !(item.gsc_data && item.indexnow_data)) return false;
      if (urlsFilters.hasClicks === 'yes' && (!item.clicks || item.clicks === 0)) return false;
      if (urlsFilters.hasClicks === 'no' && item.clicks && item.clicks > 0) return false;
      return true;
    });
  };

  const filterHistoryData = (data: any[]) => {
    return data.filter(item => {
      if (historyFilters.status !== 'all' && item.status !== historyFilters.status) return false;
      if (historyFilters.hasErrors === 'yes' && (!item.urls_failed || item.urls_failed === 0)) return false;
      if (historyFilters.hasErrors === 'no' && item.urls_failed && item.urls_failed > 0) return false;
      return true;
    });
  };

  const toggleUrl = (urlId: string) => {
    setSelectedUrls(prev => prev.includes(urlId) ? prev.filter(id => id !== urlId) : [...prev, urlId]);
  };

  const toggleAll = () => {
    if (selectedUrls.length === urls?.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(urls?.map(u => u.id) || []);
    }
  };

  const clearSelection = () => setSelectedUrls([]);

  const processedUrls = sortData(filterUrlsData(urls || []), urlsSort);
  const processedHistory = sortData(filterHistoryData(indexingHistory || []), historySort);

  const totalUrls = urls?.length || 0;
  const indexedUrls = urls?.filter(u => u.current_status === 'indexed').length || 0;
  const discoveredUrls = urls?.filter(u => u.current_status === 'discovered').length || 0;
  const selectedCount = selectedUrls.length;

  const totalJobs = indexingHistory?.length || 0;
  const completedJobs = indexingHistory?.filter(j => j.status === 'completed').length || 0;
  const totalProcessed = indexingHistory?.reduce((sum, j) => sum + (j.urls_processed || 0), 0) || 0;
  const totalSuccessful = indexingHistory?.reduce((sum, j) => sum + (j.urls_successful || 0), 0) || 0;
  const totalFailed = indexingHistory?.reduce((sum, j) => sum + (j.urls_failed || 0), 0) || 0;

  const getStatusBadge = (status: string | null) => {
    const isDark = document.documentElement.classList.contains('dark');
    switch (status) {
      case 'indexed':
        return <Badge className={isDark ? "bg-green-900/30 text-green-300 border-green-700" : "bg-green-100 text-green-700 border-green-300"}>Indexado</Badge>;
      case 'queued':
        return <Badge className={isDark ? "bg-blue-900/30 text-blue-300 border-blue-700" : "bg-blue-100 text-blue-700 border-blue-300"}>Na Fila</Badge>;
      case 'discovered':
        return <Badge className={isDark ? "bg-yellow-900/30 text-yellow-300 border-yellow-700" : "bg-yellow-100 text-yellow-700 border-yellow-300"}>Descoberto</Badge>;
      case 'failed':
        return <Badge className={isDark ? "bg-red-900/30 text-red-300 border-red-700" : "bg-red-100 text-red-700 border-red-300"}>Falhou</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    const isDark = document.documentElement.classList.contains('dark');
    switch (status) {
      case 'completed':
        return <Badge className={isDark ? "bg-green-900/30 text-green-300 border-green-700" : "bg-green-100 text-green-700 border-green-300"}>Completo</Badge>;
      case 'running':
        return <Badge className={isDark ? "bg-blue-900/30 text-blue-300 border-blue-700" : "bg-blue-100 text-blue-700 border-blue-300"}>Em Execução</Badge>;
      case 'failed':
        return <Badge className={isDark ? "bg-red-900/30 text-red-300 border-red-700" : "bg-red-100 text-red-700 border-red-300"}>Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  interface SortableHeaderProps {
    field: SortField | string;
    label: string;
    currentSort: SortState;
    onSort: (field: any) => void;
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
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>URLs Descobertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de URLs</p>
                    <p className="text-2xl font-bold">{totalUrls.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Indexadas</p>
                    <p className="text-2xl font-bold">{indexedUrls.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Descobertas</p>
                    <p className="text-2xl font-bold">{discoveredUrls.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <List className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Selecionadas</p>
                    <p className="text-2xl font-bold">{selectedCount.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedUrls.length > 0 && (
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertDescription className="flex items-center justify-between">
                <span className="text-blue-900 dark:text-blue-300">
                  {selectedUrls.length} URL(s) selecionada(s)
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearSelection}
                  >
                    Limpar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => sendToIndexing.mutate(selectedUrls)}
                    disabled={sendToIndexing.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para Indexação GSC
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={urlsFilters.status} onValueChange={(value) => setUrlsFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="discovered">Descoberto</SelectItem>
                <SelectItem value="queued">Na Fila</SelectItem>
                <SelectItem value="indexed">Indexado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urlsFilters.origin} onValueChange={(value) => setUrlsFilters(prev => ({ ...prev, origin: value }))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Origens</SelectItem>
                <SelectItem value="gsc">GSC</SelectItem>
                <SelectItem value="sitemap">Sitemap</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urlsFilters.hasClicks} onValueChange={(value) => setUrlsFilters(prev => ({ ...prev, hasClicks: value }))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Cliques" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Com Cliques</SelectItem>
                <SelectItem value="no">Sem Cliques</SelectItem>
              </SelectContent>
            </Select>

            {(urlsFilters.status !== 'all' || urlsFilters.origin !== 'all' || urlsFilters.hasClicks !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUrlsFilters({ status: 'all', origin: 'all', hasClicks: 'all' })}
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedUrls.length === urls?.length && urls?.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <SortableHeader field="url" label="URL" currentSort={urlsSort} onSort={handleUrlsSort} />
                  <SortableHeader field="current_status" label="Status Indexação" currentSort={urlsSort} onSort={handleUrlsSort} className="w-40" />
                  <SortableHeader field="impressions" label="Impressões" currentSort={urlsSort} onSort={handleUrlsSort} className="w-32" />
                  <SortableHeader field="clicks" label="Cliques" currentSort={urlsSort} onSort={handleUrlsSort} className="w-28" />
                  <SortableHeader field="ctr" label="CTR" currentSort={urlsSort} onSort={handleUrlsSort} className="w-28" />
                  <SortableHeader field="position" label="Posição" currentSort={urlsSort} onSort={handleUrlsSort} className="w-28" />
                  <SortableHeader field="last_seen_at" label="Última Visualização" currentSort={urlsSort} onSort={handleUrlsSort} className="w-44" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedUrls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Nenhuma URL encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  processedUrls.map((url) => (
                    <TableRow key={url.id} className="h-16">
                      <TableCell>
                        <Checkbox 
                          checked={selectedUrls.includes(url.id)}
                          onCheckedChange={() => toggleUrl(url.id)}
                        />
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="flex items-center gap-2">
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                          >
                            {url.url}
                          </a>
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(url.current_status)}</TableCell>
                      <TableCell className="text-right">{url.impressions?.toLocaleString('pt-BR') || '-'}</TableCell>
                      <TableCell className="text-right">{url.clicks?.toLocaleString('pt-BR') || '-'}</TableCell>
                      <TableCell className="text-right">{url.ctr ? `${(url.ctr * 100).toFixed(2)}%` : '-'}</TableCell>
                      <TableCell className="text-right">{url.position ? url.position.toFixed(1) : '-'}</TableCell>
                      <TableCell>
                        {url.last_seen_at ? format(new Date(url.last_seen_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount.toLocaleString('pt-BR')} URLs
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="border-t pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Histórico de Indexação</h3>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Atualiza a cada 30s
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Jobs</p>
                  <p className="text-2xl font-bold">{totalJobs.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completos</p>
                  <p className="text-2xl font-bold">{completedJobs.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <List className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">URLs Processadas</p>
                  <p className="text-2xl font-bold">{totalProcessed.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bem-sucedidas</p>
                  <p className="text-2xl font-bold">{totalSuccessful.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Falhadas</p>
                  <p className="text-2xl font-bold">{totalFailed.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 items-center mb-4">
          <Select value={historyFilters.status} onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="completed">Completo</SelectItem>
              <SelectItem value="running">Em Execução</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>

          <Select value={historyFilters.hasErrors} onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, hasErrors: value }))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Erros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Com Erros</SelectItem>
              <SelectItem value="no">Sem Erros</SelectItem>
            </SelectContent>
          </Select>

          {(historyFilters.status !== 'all' || historyFilters.hasErrors !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistoryFilters({ status: 'all', hasErrors: 'all' })}
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="created_at" label="Data/Hora" currentSort={historySort} onSort={handleHistorySort} className="w-44" />
                <SortableHeader field="status" label="Status" currentSort={historySort} onSort={handleHistorySort} className="w-32" />
                <SortableHeader field="urls_processed" label="URLs Processadas" currentSort={historySort} onSort={handleHistorySort} className="w-44" />
                <SortableHeader field="urls_successful" label="Bem-sucedidas" currentSort={historySort} onSort={handleHistorySort} className="w-36" />
                <SortableHeader field="urls_failed" label="Falhadas" currentSort={historySort} onSort={handleHistorySort} className="w-32" />
                <TableHead className="w-32">Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : processedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhum histórico de indexação encontrado
                  </TableCell>
                </TableRow>
              ) : (
                processedHistory.map((job) => {
                  const duration = job.started_at && job.completed_at
                    ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
                    : null;
                  return (
                    <TableRow key={job.id} className="h-16">
                      <TableCell>
                        {format(new Date(job.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right">{job.urls_processed?.toLocaleString('pt-BR') || '0'}</TableCell>
                      <TableCell className="text-right">{job.urls_successful?.toLocaleString('pt-BR') || '0'}</TableCell>
                      <TableCell className="text-right">{job.urls_failed?.toLocaleString('pt-BR') || '0'}</TableCell>
                      <TableCell className="text-right">
                        {duration ? `${duration}s` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGSCDiscoveredUrls } from '@/hooks/useGSCDiscoveredUrls';
import { useGSCMonitoring } from '@/hooks/useGSCMonitoring';
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
  CheckCircle2,
  List, 
  AlertCircle, 
  History, 
  Send,
  TrendingUp,
  Clock,
  Activity,
  Calendar,
  Shield,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { URLValidationBadge } from './URLValidationBadge';
import { GoogleInspectionBadge } from './GoogleInspectionBadge';

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUrls, setSelectedUrls] = useState<Array<{id: string, url: string}>>([]);
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

  const { urls, isLoading, totalCount } = useGSCDiscoveredUrls(siteId, {
    searchTerm,
  });

  const { validationStats, retryStats, inspectionStats } = useGSCMonitoring(siteId);

  // Query para contar URLs enviadas (global)
  const { data: sentCount } = useQuery({
    queryKey: ['gsc-urls-sent-count', siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('current_status', 'sent');
      if (error) throw error;
      return count || 0;
    },
  });

  // Query para contar URLs descobertas (global)
  const { data: discoveredCount } = useQuery({
    queryKey: ['gsc-urls-discovered-count', siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('current_status', 'discovered');
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: indexingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['gsc-indexing-jobs', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_indexing_jobs')
        .select('*')
        .eq('site_id', siteId)
        .eq('job_type', 'instant')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const queryClient = useQueryClient();

  // Fetch aggregated quota data
  const { data: quotaData, isLoading: quotaLoading } = useQuery({
    queryKey: ['gsc-aggregated-quota', siteId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gsc-get-aggregated-quota', {
        body: { site_id: siteId }
      });
      if (error) throw error;
      return data.aggregated_quota;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const sendToIndexing = useMutation({
    mutationFn: async (urlsToSend: Array<{id: string, url: string}>) => {
      const { data, error } = await supabase.functions.invoke('gsc-instant-index', {
        body: { 
          site_id: siteId,
          urls: urlsToSend.map(u => u.url),
          integration_id: null
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.urls_successful || 0} URLs enviadas para indexação`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-validation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-retry-stats'] });
    },
    onError: (error: any) => {
      const errorMessage = error.message?.toLowerCase() || '';
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('rate_limit') || 
                          errorMessage.includes('429');
      
      if (isQuotaError) {
        const now = new Date();
        const resetTime = new Date(now);
        resetTime.setUTCHours(24, 0, 0, 0);
        const hoursUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        toast.error(
          `Cota diária do Google esgotada (200 URLs/dia). Reset em ~${hoursUntilReset}h às 00:00 UTC`,
          { duration: 8000 }
        );
      } else {
        toast.error(`Erro ao enviar URLs: ${error.message}`);
      }
    }
  });

  // ✅ FASE 1: Mutation para validar URLs manualmente
  const validateUrls = useMutation({
    mutationFn: async (urlsToValidate: string[]) => {
      const { data, error } = await supabase.functions.invoke('gsc-validate-urls', {
        body: { site_id: siteId, urls: urlsToValidate }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.valid} URLs válidas, ${data.invalid_domain + data.unreachable} com problemas`);
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-validation-stats'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao validar URLs: ${error.message}`);
    }
  });

  // ✅ Mutation para consultar status no Google manualmente
  const syncGoogleStatus = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gsc-sync-inspection-status', {
        body: { site_id: siteId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `✅ Consultadas ${data.total} URLs no Google: ${data.inspected} atualizadas, ${data.errors} erros`,
        { duration: 5000 }
      );
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-inspection-stats'] });
    },
    onError: (error: any) => {
      toast.error(`❌ Erro ao consultar Google: ${error.message}`);
    }
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    console.log('🔍 toggleUrl called:', { urlId, processedUrlsLength: processedUrls?.length });
    setSelectedUrls(prev => {
      const exists = prev.find(u => u.id === urlId);
      if (exists) {
        console.log('✅ URL already selected, removing:', urlId);
        return prev.filter(u => u.id !== urlId);
      } else {
        const urlObj = processedUrls?.find(u => u.id === urlId);
        console.log('🔍 Looking for URL in processedUrls:', { found: !!urlObj, urlId });
        if (!urlObj) {
          console.error('❌ URL not found in processedUrls!', { urlId, processedUrlsLength: processedUrls?.length });
          return prev;
        }
        console.log('✅ Adding URL to selection:', urlObj);
        return [...prev, { id: urlObj.id, url: urlObj.url }];
      }
    });
  };

  const toggleAll = () => {
    const paginatedUrls = processedUrls || [];
    const allCurrentSelected = paginatedUrls.every(u => selectedUrls.some(s => s.id === u.id));
    
    if (allCurrentSelected) {
      setSelectedUrls(prev => prev.filter(s => !paginatedUrls.some(u => u.id === s.id)));
    } else {
      const newSelections = paginatedUrls.filter(u => !selectedUrls.some(s => s.id === u.id));
      setSelectedUrls(prev => [...prev, ...newSelections.map(u => ({ id: u.id, url: u.url }))]);
    }
  };

  const clearSelection = () => setSelectedUrls([]);

  // Aplicar filtros e ordenação ANTES da paginação
  const filteredAndSorted = sortData(filterUrlsData(urls || []), urlsSort);
  
  // Calcular paginação baseada em dados filtrados
  const filteredCount = filteredAndSorted.length;
  const totalPagesAdjusted = Math.ceil(filteredCount / pageSize);
  
  // ENTÃO aplicar paginação no frontend
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize;
  const processedUrls = filteredAndSorted.slice(from, to);
  
  const processedHistory = sortData(filterHistoryData(indexingHistory || []), historySort);

  const totalUrls = totalCount;
  const discoveredUrls = discoveredCount || 0;
  const sentUrls = sentCount || 0;
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
        return <Badge className={isDark ? "bg-green-900/30 text-green-300 border-green-700" : "bg-green-100 text-green-700 border-green-300"}>Indexado (legado)</Badge>;
      case 'sent':
        return <Badge className={isDark ? "bg-green-900/30 text-green-300 border-green-700" : "bg-green-100 text-green-700 border-green-300"}><CheckCircle2 className="w-3 h-3 mr-1" />Enviado</Badge>;
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
      {/* Quota Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-blue-600" />
            Quota Diária de Indexação GSC
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {quotaData?.total_integrations || 0} conexão(ões) GSC ativa(s)
            {quotaData && quotaData.unhealthy_count > 0 && (
              <span className="ml-2 text-destructive font-medium">
                ({quotaData.unhealthy_count} de {quotaData.total_integrations} bloqueada(s))
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          {quotaLoading ? (
            <div className="text-center text-muted-foreground">Carregando quota...</div>
          ) : (
            <div className="space-y-4">
              {/* Critical Alert - Quota Excedida */}
              {quotaData && quotaData.total_used > quotaData.total_limit && (
                <Alert variant="destructive" className="animate-pulse">
                  <AlertCircle className="h-5 w-5" />
                  <div className="ml-2">
                    <h3 className="font-semibold text-base mb-1">⚠️ Quota Diária Excedida!</h3>
                    <AlertDescription className="space-y-2">
                      <p>
                        Você enviou <strong>{quotaData.total_used - quotaData.total_limit} URLs além do limite</strong> de {quotaData.total_limit} URLs/dia.
                      </p>
                      <p className="text-sm">
                        <strong>Consequências:</strong> URLs acima do limite foram rejeitadas pelo Google. 
                        {quotaData.unhealthy_count > 0 && (
                          <span className="block mt-1">
                            {quotaData.unhealthy_count} conexão(ões) marcada(s) como "unhealthy" até o reset da quota.
                          </span>
                        )}
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Quota reseta em {(() => {
                          const now = new Date();
                          const resetTime = new Date(now);
                          resetTime.setUTCHours(24, 0, 0, 0);
                          const hoursUntilReset = Math.floor((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
                          const minutesUntilReset = Math.floor(((resetTime.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hoursUntilReset}h ${minutesUntilReset}min`;
                        })()}
                      </p>
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {quotaData?.total_used || 0} / {quotaData?.total_limit || 200}
                </span>
                <div className="flex gap-2">
                  {quotaData && quotaData.total_used > quotaData.total_limit && (
                    <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                      ⚠️ +{quotaData.total_used - quotaData.total_limit} BLOQUEADAS
                    </Badge>
                  )}
                  <Badge 
                    className={
                      (quotaData?.total_remaining || 200) > 1000 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                        : (quotaData?.total_remaining || 200) > 500 
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }
                  >
                    {quotaData?.total_remaining || 200} restantes
                  </Badge>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={Math.min(quotaData?.percentage || 0, 100)} 
                  className={`h-3 ${quotaData && quotaData.percentage > 100 ? '[&>div]:bg-destructive [&>div]:animate-pulse' : ''}`}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {quotaData?.percentage || 0}% utilizado
                </p>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Quota reseta diariamente às 00:00 UTC
                {quotaData && quotaData.percentage > 100 && (
                  <span className="ml-auto text-destructive font-medium">
                    Reset em {(() => {
                      const now = new Date();
                      const resetTime = new Date(now);
                      resetTime.setUTCHours(24, 0, 0, 0);
                      const hoursUntilReset = Math.floor((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
                      const minutesUntilReset = Math.floor(((resetTime.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
                      return `${hoursUntilReset}h ${minutesUntilReset}min`;
                    })()}
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Consulta Manual do Google Status */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={() => syncGoogleStatus.mutate()}
          disabled={syncGoogleStatus.isPending}
          size="lg"
          className="gap-2"
        >
          {syncGoogleStatus.isPending ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Consultando Google... Isso pode levar alguns minutos
            </>
          ) : (
            <>
              <Eye className="h-5 w-5" />
              Consultar Status no Google (Todas as URLs)
            </>
          )}
        </Button>
      </div>

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
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Descobertas</p>
                    <p className="text-2xl font-bold">{discoveredCount?.toLocaleString('pt-BR') || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                    <Send className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enviadas</p>
                    <p className="text-2xl font-bold">{sentCount?.toLocaleString('pt-BR') || 0}</p>
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
                  {/* ✅ FASE 1: Botão Validar URLs */}
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const urlsToValidate = selectedUrls.map(u => u.url);
                      validateUrls.mutate(urlsToValidate);
                    }}
                    disabled={validateUrls.isPending}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {validateUrls.isPending ? 'Validando...' : 'Validar URLs'}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      if (selectedUrls.length === 0) {
                        toast.error('Selecione pelo menos uma URL para indexar');
                        return;
                      }
                      sendToIndexing.mutate(selectedUrls);
                    }}
                    disabled={sendToIndexing.isPending || selectedUrls.length === 0}
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
              <SelectItem value="sent">Enviado</SelectItem>
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
                      checked={
                        processedUrls?.length > 0 && 
                        processedUrls.every(u => selectedUrls.some(s => s.id === u.id))
                      }
                      onCheckedChange={() => {
                        console.log('📋 Select all checkbox clicked');
                        toggleAll();
                      }}
                    />
                  </TableHead>
                  <SortableHeader field="url" label="URL" currentSort={urlsSort} onSort={handleUrlsSort} />
                  <SortableHeader field="current_status" label="Status GSC" currentSort={urlsSort} onSort={handleUrlsSort} className="w-36" />
                  <TableHead className="w-36">Validação</TableHead>
                  <TableHead className="w-36">Google Status</TableHead>
                  <SortableHeader field="impressions" label="Impressões" currentSort={urlsSort} onSort={handleUrlsSort} className="w-28" />
                  <SortableHeader field="clicks" label="Cliques" currentSort={urlsSort} onSort={handleUrlsSort} className="w-24" />
                  <SortableHeader field="last_seen_at" label="Última Vista" currentSort={urlsSort} onSort={handleUrlsSort} className="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedUrls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Nenhuma URL encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  processedUrls.map((url) => (
                    <TableRow key={url.id} className="h-16">
                      <TableCell>
                        <Checkbox 
                          checked={selectedUrls.some(u => u.id === url.id)}
                          onCheckedChange={() => toggleUrl(url.id)}
                        />
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="flex items-center gap-2">
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline truncate text-sm"
                          >
                            {url.url}
                          </a>
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(url.current_status)}</TableCell>
                      {/* ✅ FASE 1: Coluna Validação */}
                      <TableCell>
                        <URLValidationBadge 
                          validationStatus={url.validation_status} 
                          validationError={url.validation_error}
                        />
                      </TableCell>
                      {/* ✅ FASE 3: Coluna Google Status */}
                      <TableCell>
                        <GoogleInspectionBadge 
                          inspectionStatus={url.google_inspection_status}
                          lastInspectedAt={url.google_last_inspected_at}
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm">{url.impressions?.toLocaleString('pt-BR') || '-'}</TableCell>
                      <TableCell className="text-right text-sm">{url.clicks?.toLocaleString('pt-BR') || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {url.last_seen_at ? format(new Date(url.last_seen_at), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPagesAdjusted > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredCount)} de {filteredCount.toLocaleString('pt-BR')} URLs
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
                  {Array.from({ length: Math.min(5, totalPagesAdjusted) }, (_, i) => {
                    let pageNum;
                    if (totalPagesAdjusted <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPagesAdjusted - 2) {
                      pageNum = totalPagesAdjusted - 4 + i;
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPagesAdjusted, prev + 1))}
                  disabled={currentPage === totalPagesAdjusted}
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

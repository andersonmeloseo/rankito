import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Send, RotateCw, AlertCircle, History, ArrowUp, ArrowDown, ArrowUpDown, FileText, CheckCircle, List, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { extractEdgeFunctionError, EdgeFunctionErrorData } from "@/utils/edgeFunctionError";
import { GSCErrorDialog } from "./GSCErrorDialog";

interface GSCSitemapsManagerProps {
  siteId: string;
  integrationId: string;
}

type SortField = 'sitemap_url' | 'sitemap_type' | 'page_count' | 'gsc_status' | 'gsc_last_submitted' | 'gsc_last_downloaded' | 'errors_count' | 'warnings_count';
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
        {isActive && (
          currentSort.direction === 'asc' 
            ? <ArrowUp className="h-4 w-4" />
            : <ArrowDown className="h-4 w-4" />
        )}
        {!isActive && <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
      </div>
    </TableHead>
  );
};

export function GSCSitemapsManager({ siteId, integrationId }: GSCSitemapsManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSitemaps, setSelectedSitemaps] = useState<string[]>([]);
  const [sitemapToDelete, setSitemapToDelete] = useState<string | null>(null);
  const [errorDialogData, setErrorDialogData] = useState<EdgeFunctionErrorData | null>(null);
  
  const [discoverySort, setDiscoverySort] = useState<SortState>({
    field: 'sitemap_url',
    direction: 'asc'
  });

  const [historySort, setHistorySort] = useState<SortState>({
    field: 'gsc_last_submitted',
    direction: 'desc'
  });

  const [discoveryFilters, setDiscoveryFilters] = useState({
    status: 'all',
    type: 'all'
  });

  const [historyFilters, setHistoryFilters] = useState({
    status: 'all',
    hasErrors: 'all',
    hasWarnings: 'all'
  });

  // Fetch integration data for service account email
  const { data: integration } = useQuery({
    queryKey: ['gsc-integration', integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_search_console_integrations')
        .select('id, service_account_json')
        .eq('id', integrationId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Extract service account email from JSON
  const serviceAccountEmail = integration?.service_account_json 
    ? (integration.service_account_json as any)?.client_email 
    : undefined;

  // Fetch sitemaps from database (discovery section)
  const { data: sitemaps, isLoading } = useQuery({
    queryKey: ['gsc-sitemaps', siteId, integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_sitemap_submissions')
        .select('*')
        .eq('site_id', siteId)
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch submission history with auto-refresh
  const { data: submissionHistory } = useQuery({
    queryKey: ['gsc-sitemap-history', siteId, integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_sitemap_submissions')
        .select('*')
        .eq('site_id', siteId)
        .eq('integration_id', integrationId)
        .order('gsc_last_submitted', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch sitemaps from GSC
  const fetchSitemaps = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await supabase.functions.invoke('gsc-get-sitemaps', {
        body: { integration_id: integrationId },
      });

      // Check for detailed error in response.data (edge function returns structured errors)
      if (response.error) {
        const detailedError = extractEdgeFunctionError(response);
        if (detailedError) {
          const error = new Error(detailedError.message || detailedError.error);
          (error as any).detailedData = detailedError;
          throw error;
        }
        throw response.error;
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemap-history'] });
      toast.success(`${data.sitemaps.length} sitemaps sincronizados do GSC`);
    },
    onError: (error: any) => {
      // If has detailed data with instructions, show dialog
      if (error.detailedData?.instructions) {
        setErrorDialogData(error.detailedData);
        return;
      }
      // Fallback to simple toast
      toast.error(`Erro ao buscar sitemaps: ${error.message}`);
    },
  });

  // Submit sitemaps for indexing
  const submitSitemaps = useMutation({
    mutationFn: async (sitemapIds: string[]) => {
      const results = [];
      for (const sitemapId of sitemapIds) {
        const sitemap = sitemaps?.find(s => s.id === sitemapId);
        if (!sitemap) continue;
        
        const response = await supabase.functions.invoke('gsc-submit-sitemap', {
          body: {
            integration_id: integrationId,
            sitemap_url: sitemap.sitemap_url,
          },
        });
        
        results.push({ 
          sitemap: sitemap.sitemap_url, 
          success: !response.error,
          error: response.error,
          data: response.data 
        });
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemap-history'] });
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (errorCount > 0) {
        toast.warning(
          `✅ ${successCount} sitemap(s) enviado(s) com sucesso. ❌ ${errorCount} falharam.`,
          { duration: 7000 }
        );
      } else {
        toast.success(`✅ ${successCount} sitemap(s) enviado(s) para indexação no GSC!`);
      }
      setSelectedSitemaps([]);
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar sitemaps: ${error.message}`);
    },
  });

  // Submit single sitemap (for resubmit button)
  const resubmitSitemap = useMutation({
    mutationFn: async (sitemapUrl: string) => {
      const response = await supabase.functions.invoke('gsc-submit-sitemap', {
        body: {
          integration_id: integrationId,
          sitemap_url: sitemapUrl,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemap-history'] });
      toast.success('✅ Sitemap reenviado para indexação!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao reenviar sitemap: ${error.message}`);
    },
  });

  // Delete sitemap from GSC and database
  const deleteSitemap = useMutation({
    mutationFn: async (sitemapUrl: string) => {
      const response = await supabase.functions.invoke('gsc-delete-sitemap', {
        body: {
          integration_id: integrationId,
          sitemap_url: sitemapUrl,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps', siteId, integrationId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemap-history', siteId, integrationId] });
      
      if (data.warning) {
        toast.warning(`⚠️ ${data.message}`);
      } else {
        toast.success('🗑️ Sitemap excluído com sucesso!');
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir sitemap: ${error.message}`);
    },
  });

  const handleDeleteConfirm = () => {
    if (sitemapToDelete) {
      deleteSitemap.mutate(sitemapToDelete);
      setSitemapToDelete(null);
    }
  };

  const toggleSitemap = (id: string) => {
    setSelectedSitemaps(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedSitemaps.length === sitemaps?.length) {
      setSelectedSitemaps([]);
    } else {
      setSelectedSitemaps(sitemaps?.map(s => s.id) || []);
    }
  };

  const handleDiscoverySort = (field: SortField) => {
    setDiscoverySort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleHistorySort = (field: SortField) => {
    setHistorySort(prev => ({
      field,
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
        return sortState.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortState.direction === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  };

  const filterDiscoveryData = (data: any[]) => {
    return data.filter(item => {
      if (discoveryFilters.status !== 'all' && item.gsc_status !== discoveryFilters.status) {
        return false;
      }
      if (discoveryFilters.type !== 'all' && item.sitemap_type !== discoveryFilters.type) {
        return false;
      }
      return true;
    });
  };

  const filterHistoryData = (data: any[]) => {
    return data.filter(item => {
      if (historyFilters.status !== 'all' && item.gsc_status !== historyFilters.status) {
        return false;
      }
      if (historyFilters.hasErrors === 'yes' && (!item.errors_count || item.errors_count === 0)) {
        return false;
      }
      if (historyFilters.hasErrors === 'no' && item.errors_count > 0) {
        return false;
      }
      if (historyFilters.hasWarnings === 'yes' && (!item.warnings_count || item.warnings_count === 0)) {
        return false;
      }
      if (historyFilters.hasWarnings === 'no' && item.warnings_count > 0) {
        return false;
      }
      return true;
    });
  };

  const processedSitemaps = sortData(
    filterDiscoveryData(sitemaps || []),
    discoverySort
  );

  const processedHistory = sortData(
    filterHistoryData(submissionHistory || []),
    historySort
  );

  const totalDiscoveredPages = processedSitemaps
    .filter(s => s.sitemap_type !== 'sitemapindex')
    .reduce((sum, s) => sum + (s.page_count || 0), 0);
  const totalHistoryPages = processedHistory
    .filter(s => s.sitemap_type !== 'sitemapindex')
    .reduce((sum, s) => sum + (s.page_count || 0), 0);

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Sucesso</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Pendente</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Erro</Badge>;
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">Aviso</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const DiscoveryFilters = () => (
    <div className="flex gap-3 items-center flex-wrap">
      <Select 
        value={discoveryFilters.status} 
        onValueChange={(value) => setDiscoveryFilters(prev => ({ ...prev, status: value }))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Status</SelectItem>
          <SelectItem value="success">Sucesso</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="error">Erro</SelectItem>
          <SelectItem value="warning">Aviso</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={discoveryFilters.type} 
        onValueChange={(value) => setDiscoveryFilters(prev => ({ ...prev, type: value }))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Tipos</SelectItem>
          <SelectItem value="index">Index</SelectItem>
          <SelectItem value="regular">Regular</SelectItem>
        </SelectContent>
      </Select>

      {(discoveryFilters.status !== 'all' || discoveryFilters.type !== 'all') && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setDiscoveryFilters({ status: 'all', type: 'all' })}
        >
          Limpar Filtros
        </Button>
      )}
    </div>
  );

  const HistoryFilters = () => (
    <div className="flex gap-3 items-center flex-wrap">
      <Select 
        value={historyFilters.status} 
        onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, status: value }))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Status</SelectItem>
          <SelectItem value="success">Sucesso</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="error">Erro</SelectItem>
          <SelectItem value="warning">Aviso</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={historyFilters.hasErrors} 
        onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, hasErrors: value }))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Erros" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="yes">Com Erros</SelectItem>
          <SelectItem value="no">Sem Erros</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={historyFilters.hasWarnings} 
        onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, hasWarnings: value }))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Avisos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="yes">Com Avisos</SelectItem>
          <SelectItem value="no">Sem Avisos</SelectItem>
        </SelectContent>
      </Select>

      {(historyFilters.status !== 'all' || historyFilters.hasErrors !== 'all' || historyFilters.hasWarnings !== 'all') && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setHistoryFilters({ status: 'all', hasErrors: 'all', hasWarnings: 'all' })}
        >
          Limpar Filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* SEÇÃO 1: Descoberta e Envio para Indexação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Descoberta e Envio para Indexação
          </CardTitle>
          <CardDescription>
            Busque sitemaps do Google Search Console e envie-os para indexação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => fetchSitemaps.mutate()}
              disabled={fetchSitemaps.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${fetchSitemaps.isPending ? 'animate-spin' : ''}`} />
              Buscar Sitemaps no GSC
            </Button>
            <Button
              onClick={() => submitSitemaps.mutate(selectedSitemaps)}
              disabled={selectedSitemaps.length === 0 || submitSitemaps.isPending}
              variant="default"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar {selectedSitemaps.length > 0 ? selectedSitemaps.length : ''} para Indexação no GSC
            </Button>
          </div>

          <DiscoveryFilters />

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando sitemaps...
            </div>
          ) : processedSitemaps && processedSitemaps.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Páginas</p>
                      <p className="text-2xl font-bold">{totalDiscoveredPages.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sitemaps</p>
                      <p className="text-2xl font-bold">{processedSitemaps.length}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <List className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Selecionados</p>
                      <p className="text-2xl font-bold">{selectedSitemaps.length}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSitemaps.length === processedSitemaps.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <SortableHeader 
                    field="sitemap_url" 
                    label="URL do Sitemap" 
                    currentSort={discoverySort} 
                    onSort={handleDiscoverySort}
                  />
                  <SortableHeader 
                    field="sitemap_type" 
                    label="Tipo" 
                    currentSort={discoverySort} 
                    onSort={handleDiscoverySort}
                  />
                  <SortableHeader 
                    field="page_count" 
                    label="Páginas" 
                    currentSort={discoverySort} 
                    onSort={handleDiscoverySort}
                  />
                  <SortableHeader 
                    field="gsc_status" 
                    label="Status GSC" 
                    currentSort={discoverySort} 
                    onSort={handleDiscoverySort}
                  />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedSitemaps.map((sitemap) => (
                  <TableRow key={sitemap.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSitemaps.includes(sitemap.id)}
                        onCheckedChange={() => toggleSitemap(sitemap.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-md truncate">
                      {sitemap.sitemap_url}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sitemap.sitemap_type || 'urlset'}</Badge>
                    </TableCell>
                    <TableCell>
                      {sitemap.sitemap_type === 'sitemapindex' ? (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Index (não contabilizado)
                        </Badge>
                      ) : (
                        <span>{sitemap.page_count || 0}</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(sitemap.gsc_status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSitemapToDelete(sitemap.sitemap_url)}
                        className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          ) : sitemaps && sitemaps.length > 0 && processedSitemaps.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum sitemap encontrado com os filtros aplicados. Tente ajustar os filtros.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum sitemap encontrado. Clique em "Buscar Sitemaps no GSC" para sincronizar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 2: Histórico de Envios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Envios para Indexação
          </CardTitle>
          <CardDescription>
            Acompanhe o status de todos os sitemaps enviados para indexação no GSC (atualiza a cada 30s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <HistoryFilters />

          {submissionHistory && submissionHistory.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Páginas</p>
                      <p className="text-2xl font-bold">{totalHistoryPages.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Envios</p>
                      <p className="text-2xl font-bold">{processedHistory.length}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Erros</p>
                      <p className="text-2xl font-bold">
                        {processedHistory.reduce((sum, s) => sum + (s.errors_count || 0), 0)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader 
                    field="sitemap_url" 
                    label="URL do Sitemap" 
                    currentSort={historySort} 
                    onSort={handleHistorySort}
                  />
                  <SortableHeader 
                    field="gsc_status" 
                    label="Status" 
                    currentSort={historySort} 
                    onSort={handleHistorySort}
                  />
                  <SortableHeader 
                    field="gsc_last_submitted" 
                    label="Última Submissão" 
                    currentSort={historySort} 
                    onSort={handleHistorySort}
                  />
                  <SortableHeader 
                    field="gsc_last_downloaded" 
                    label="Último Download (Google)" 
                    currentSort={historySort} 
                    onSort={handleHistorySort}
                  />
                  <SortableHeader 
                    field="page_count" 
                    label="Páginas" 
                    currentSort={historySort} 
                    onSort={handleHistorySort}
                  />
                  <SortableHeader 
                    field="errors_count" 
                    label="Erros" 
                    currentSort={historySort} 
                    onSort={handleHistorySort}
                  />
                  <SortableHeader 
                    field="warnings_count" 
                    label="Avisos" 
                    currentSort={historySort} 
                    onSort={handleHistorySort}
                  />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedHistory.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {submission.sitemap_url}
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.gsc_status)}</TableCell>
                    <TableCell className="text-sm">
                      {submission.gsc_last_submitted 
                        ? format(new Date(submission.gsc_last_submitted), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {submission.gsc_last_downloaded 
                        ? format(new Date(submission.gsc_last_downloaded), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {submission.sitemap_type === 'sitemapindex' ? (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Index (não contabilizado)
                        </Badge>
                      ) : (
                        <span>{submission.page_count || 0}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.errors_count ? (
                        <Badge variant="destructive">{submission.errors_count}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.warnings_count ? (
                        <Badge className="bg-yellow-100 text-yellow-800">{submission.warnings_count}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resubmitSitemap.mutate(submission.sitemap_url)}
                          disabled={resubmitSitemap.isPending}
                          className="gap-2"
                        >
                          <RotateCw className={`h-4 w-4 ${resubmitSitemap.isPending ? 'animate-spin' : ''}`} />
                          Reenviar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSitemapToDelete(submission.sitemap_url)}
                          className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          ) : submissionHistory && submissionHistory.length > 0 && processedHistory.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum envio encontrado com os filtros aplicados. Tente ajustar os filtros.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum histórico de envio disponível. Envie sitemaps para indexação para ver o histórico aqui.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!sitemapToDelete} onOpenChange={() => setSitemapToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sitemap?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Esta ação irá remover o sitemap do Google Search Console e do sistema.</p>
              <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                {sitemapToDelete}
              </p>
              <p className="text-destructive font-medium">Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for detailed GSC errors */}
      <GSCErrorDialog
        open={!!errorDialogData}
        onClose={() => setErrorDialogData(null)}
        data={errorDialogData}
        serviceAccountEmail={serviceAccountEmail}
      />
    </div>
  );
}

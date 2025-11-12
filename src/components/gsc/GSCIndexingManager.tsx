import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, ExternalLink, List } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GSCBatchIndexingDialog } from "./GSCBatchIndexingDialog";
import { GSCHealthDashboard } from "./GSCHealthDashboard";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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
  const PAGES_PER_PAGE = 50;

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

  // Fetch GSC status distribution
  const { data: statusDistribution, isLoading: isLoadingDistribution } = useQuery({
    queryKey: ['gsc-status-distribution', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const { data, error } = await supabase
        .from('rank_rent_pages')
        .select('gsc_indexation_status')
        .eq('site_id', siteId)
        .eq('status', 'active');

      if (error) throw error;

      // Count by status
      const counts = {
        not_submitted: 0,
        submitted: 0,
        indexed: 0,
        error: 0,
      };

      data?.forEach((page) => {
        const status = page.gsc_indexation_status || 'not_submitted';
        if (status in counts) {
          counts[status as keyof typeof counts]++;
        }
      });

      return [
        { name: 'Não Enviado', value: counts.not_submitted, color: '#94a3b8' },
        { name: 'Enviado', value: counts.submitted, color: '#f59e0b' },
        { name: 'Indexado', value: counts.indexed, color: '#10b981' },
        { name: 'Erro', value: counts.error, color: '#ef4444' },
      ].filter(item => item.value > 0);
    },
    enabled: !!siteId,
  });

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
    if (!pages) return;
    
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages.map(p => p.id)));
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
    if (!pages) return;

    const selectedUrls = pages
      .filter(p => selectedPages.has(p.id))
      .map(p => ({ url: p.page_url, page_id: p.id }));

    await addToQueue.mutateAsync({ urls: selectedUrls, distribution });
    setSelectedPages(new Set());
    setShowBatchDialog(false);
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
      {/* Health Dashboard */}
      <GSCHealthDashboard siteId={siteId} />

      {/* Status Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Distribuição de Status GSC
          </CardTitle>
          <CardDescription>
            Visão geral do status de indexação das páginas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDistribution ? (
            <Skeleton className="h-[300px] w-full" />
          ) : statusDistribution && statusDistribution.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-1/2 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 space-y-3">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge variant="outline" className="text-lg font-bold">
                      {item.value.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Nenhuma página encontrada para análise de status.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>


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
            <Button 
              type="submit" 
              disabled={isRequesting || !customUrl.trim() || quota?.remaining === 0}
            >
              {isRequesting ? "Enviando..." : "Solicitar Indexação"}
            </Button>
          </form>
        </CardContent>
      </Card>

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
                    {selectedPages.size} de {pages.length} páginas selecionadas
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
          ) : pages.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={pages.length > 0 && selectedPages.size === pages.length}
                            onCheckedChange={handleToggleAll}
                            title={`${selectedPages.size === pages.length ? 'Desmarcar' : 'Selecionar'} todas as ${pages.length} páginas`}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[300px]">Página</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="min-w-[140px]">Status GSC</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pages.map((page) => (
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

      {/* Batch Indexing Dialog */}
      <GSCBatchIndexingDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        selectedUrls={pages?.filter(p => selectedPages.has(p.id)).map(p => ({ url: p.page_url, page_id: p.id })) || []}
        remainingQuota={quota?.remaining || 0}
        totalLimit={quota?.limit || 200}
        onConfirm={handleBatchIndexing}
        isSubmitting={isAddingToQueue}
      />
    </div>
  );
}

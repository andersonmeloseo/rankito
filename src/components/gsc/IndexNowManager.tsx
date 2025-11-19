import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIndexNow } from '@/hooks/useIndexNow';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Zap, 
  ExternalLink, 
  Key, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Info,
  Copy,
  RefreshCw,
  Send,
  Clock,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface IndexNowManagerProps {
  siteId: string;
  site: {
    url: string;
    name: string;
  };
}

const PLATFORMS = [
  { name: 'IndexNow', color: 'bg-blue-500' },
  { name: 'Microsoft Bing', color: 'bg-teal-500' },
  { name: 'Yandex', color: 'bg-red-500' },
  { name: 'Naver', color: 'bg-green-500' },
  { name: 'Seznam.cz', color: 'bg-red-600' },
  { name: 'Amazon', color: 'bg-orange-500' },
  { name: 'Yep', color: 'bg-purple-500' },
];

export default function IndexNowManager({ siteId, site }: IndexNowManagerProps) {
  const [singleUrl, setSingleUrl] = useState('');
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("page_url");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectAllMode, setSelectAllMode] = useState<'page' | 'all'>('page');
  const PAGES_PER_PAGE = 50;

  const { 
    submissions, 
    isLoading, 
    siteKey, 
    isLoadingKey,
    submitUrls, 
    isSubmitting,
    regenerateKey,
    isRegenerating,
    validateKey,
    isValidating,
    isKeyValidated
  } = useIndexNow(siteId);

  // Query para estatísticas do dia
  const { data: todayStats, refetch: refetchStats } = useQuery({
    queryKey: ['indexnow-today-stats', siteId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data } = await supabase
        .from('indexnow_submissions')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', today.toISOString());
      
      const total = data?.reduce((sum, s) => sum + s.urls_count, 0) || 0;
      const success = data?.filter(s => s.status === 'success').length || 0;
      const successRate = data && data.length > 0 ? (success / data.length) * 100 : 0;
      const lastSubmission = data?.[0]?.created_at;
      
      return { total, successRate, lastSubmission };
    },
    enabled: !!siteId,
  });

  // Query para buscar todos os IDs das páginas (para seleção total)
  const { data: allPageIds } = useQuery({
    queryKey: ['all-page-ids-indexnow', siteId, searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('pages_with_indexnow_status')
        .select('id, page_url')
        .eq('site_id', siteId)
        .eq('status', 'active');
      
      if (statusFilter !== 'all') {
        query = query.eq('indexnow_status', statusFilter);
      }
      
      if (searchTerm) {
        query = query.or(`page_path.ilike.%${searchTerm}%,page_title.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!siteId,
  });

  const { data: pagesData, isLoading: isLoadingPages } = useQuery({
    queryKey: ['site-pages-indexnow', siteId, currentPage, searchTerm, statusFilter, sortBy],
    queryFn: async () => {
      const from = (currentPage - 1) * PAGES_PER_PAGE;
      const to = from + PAGES_PER_PAGE - 1;

      // Buscar contagem total
      let countQuery = supabase
        .from('pages_with_indexnow_status')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'active');

      // Buscar dados paginados
      let dataQuery = supabase
        .from('pages_with_indexnow_status')
        .select('id, page_url, page_title, page_path, created_at, gsc_indexation_status, indexnow_status, last_indexnow_submission')
        .eq('site_id', siteId)
        .eq('status', 'active');

      // Aplicar filtro de status
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('indexnow_status', statusFilter);
        dataQuery = dataQuery.eq('indexnow_status', statusFilter);
      }

      // Aplicar filtro de busca
      if (searchTerm) {
        countQuery = countQuery.or(`page_path.ilike.%${searchTerm}%,page_title.ilike.%${searchTerm}%`);
        dataQuery = dataQuery.or(`page_path.ilike.%${searchTerm}%,page_title.ilike.%${searchTerm}%`);
      }

    // Aplicar ordenação
    const sortOptions: Record<string, { column: string; ascending: boolean }> = {
      'page_path': { column: 'page_path', ascending: true },
      'page_url': { column: 'page_url', ascending: true },
      'created_at_desc': { column: 'created_at', ascending: false },
      'created_at_asc': { column: 'created_at', ascending: true },
      'submitted_at_desc': { column: 'last_indexnow_submission', ascending: false },
      'submitted_at_asc': { column: 'last_indexnow_submission', ascending: true },
    };

    const sort = sortOptions[sortBy] || sortOptions['page_url'];
      dataQuery = dataQuery
        .order(sort.column, { ascending: sort.ascending })
        .range(from, to);

      // Executar queries
      const [{ count }, { data, error }] = await Promise.all([
        countQuery,
        dataQuery
      ]);

      if (error) throw error;

      return {
        pages: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / PAGES_PER_PAGE)
      };
    },
  });


  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const siteHost = new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`).hostname;
      return urlObj.hostname === siteHost || urlObj.hostname === `www.${siteHost}`;
    } catch {
      return false;
    }
  };

  const handleSubmitSingle = () => {
    if (!singleUrl.trim()) return;

    if (!validateUrl(singleUrl)) {
      toast.error(`A URL deve pertencer ao domínio: ${site.url}`);
      return;
    }

    if (!siteKey?.indexnow_key) {
      toast.error('Chave IndexNow não configurada. Aguarde a geração automática.');
      return;
    }

    // Verificar se a URL já foi submetida
    const alreadySubmitted = displayPages.find(
      p => p.page_url === singleUrl && p.indexnow_status === 'submitted'
    );

    if (alreadySubmitted) {
      toast.warning('⚠️ Esta URL já foi enviada anteriormente', {
        description: `Última submissão: ${alreadySubmitted.last_indexnow_submission ? new Date(alreadySubmitted.last_indexnow_submission).toLocaleDateString('pt-BR') : 'Data desconhecida'}`,
        action: {
          label: 'Enviar mesmo assim',
          onClick: () => {
            submitUrls({ urls: [singleUrl] });
            setSingleUrl('');
          }
        }
      });
      return;
    }

    submitUrls({ urls: [singleUrl] });
    setSingleUrl('');
  };

  const displayPages = pagesData?.pages || [];

  const handleSelectAll = () => {
    if (selectAllMode === 'page') {
      if (selectedPages.size === displayPages.length && displayPages.length > 0) {
        setSelectedPages(new Set());
      } else {
        setSelectedPages(new Set(displayPages.map(p => p.id)));
      }
    }
  };

  const handleSelectAllFromSite = () => {
    if (!allPageIds) return;
    
    if (selectedPages.size === allPageIds.length && allPageIds.length > 0) {
      setSelectedPages(new Set());
      setSelectAllMode('page');
    } else {
      setSelectedPages(new Set(allPageIds.map(p => p.id)));
      setSelectAllMode('all');
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

  const handleIndexSelected = async () => {
    if (selectedPages.size === 0) return;

    // Buscar URLs das páginas selecionadas
    let selectedUrls: string[];
    
    if (selectAllMode === 'all') {
      const allPages = allPageIds?.filter(p => selectedPages.has(p.id)) || [];
      selectedUrls = allPages.map(p => p.page_url);
    } else {
      selectedUrls = displayPages
        .filter(p => selectedPages.has(p.id))
        .map(p => p.page_url);
    }
    
    if (selectedUrls.length === 0) return;
    
    // Filtrar URLs que já foram submetidas
    const notSubmittedUrls = selectedUrls.filter(url => {
      const page = displayPages.find(p => p.page_url === url);
      return !page || page.indexnow_status !== 'submitted';
    });

    const alreadySubmittedCount = selectedUrls.length - notSubmittedUrls.length;

    if (alreadySubmittedCount > 0) {
      toast.warning(`⚠️ ${alreadySubmittedCount} URLs já foram enviadas e serão ignoradas`, {
        description: `${notSubmittedUrls.length} URLs novas serão processadas`,
      });
    }

    if (notSubmittedUrls.length === 0) {
      toast.info('Todas as URLs selecionadas já foram enviadas anteriormente');
      return;
    }
    
    // Enviar em lotes de 100 URLs
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < notSubmittedUrls.length; i += BATCH_SIZE) {
      batches.push(notSubmittedUrls.slice(i, i + BATCH_SIZE));
    }
    
    // Criar toast persistente para progresso
    const progressToastId = toast.loading(`Preparando envio de ${notSubmittedUrls.length} URLs...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      toast.loading(`Processando lote ${i + 1} de ${batches.length} (${batches[i].length} URLs)...`, {
        id: progressToastId
      });
      
      try {
        await submitUrls({ urls: batches[i] });
        successCount += batches[i].length;
        toast.loading(`✓ Lote ${i + 1}/${batches.length} concluído | ${successCount}/${notSubmittedUrls.length} URLs processadas`, {
          id: progressToastId
        });
      } catch (error) {
        errorCount += batches[i].length;
        toast.loading(`⚠ Lote ${i + 1}/${batches.length} com erro | ${successCount}/${notSubmittedUrls.length} URLs processadas`, {
          id: progressToastId
        });
      }
    }
    
    const finalMessage = errorCount > 0 
      ? `${successCount} URLs enviadas, ${errorCount} falharam`
      : `${successCount} URLs enviadas com sucesso`;
    
    toast.success(`✓ Processamento concluído: ${finalMessage}`, {
      id: progressToastId
    });
    
    setSelectedPages(new Set());
    setSelectAllMode('page');
  };

  const handleCopyKey = () => {
    if (siteKey?.indexnow_key) {
      navigator.clipboard.writeText(siteKey.indexnow_key);
      toast.success('Chave copiada!');
    }
  };

  const handleTestFile = () => {
    if (siteKey?.indexnow_key) {
      const keyFileUrl = `${site.url.startsWith('http') ? site.url : `https://${site.url}`}/${siteKey.indexnow_key}.txt`;
      window.open(keyFileUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>IndexNow - Indexação Instantânea</CardTitle>
              <CardDescription className="mt-2">
                IndexNow é um protocolo que permite notificar mecanismos de busca sobre mudanças em seu site instantaneamente.
                Ao submeter uma URL, ela é compartilhada automaticamente com todas as plataformas suportadas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Compartilhamento Automático:</strong> Ao submeter uma URL via IndexNow, ela é automaticamente 
              compartilhada com todos os mecanismos de busca participantes, incluindo Microsoft Bing, Yandex, Naver, e outros.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium">Plataformas Suportadas:</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <Badge key={platform.name} variant="outline" className="gap-1">
                  <span className={`h-2 w-2 rounded-full ${platform.color}`} />
                  {platform.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Estatísticas do Dia */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Estatísticas do Dia
              </CardTitle>
              <CardDescription>
                Acompanhe o desempenho das submissões IndexNow de hoje
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">URLs Submetidas Hoje</div>
              <div className="text-2xl font-bold">{todayStats?.total || 0}</div>
              <div className="text-xs text-muted-foreground">
                Sem limite diário no IndexNow
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              <div className="text-2xl font-bold text-green-600">
                {todayStats?.successRate.toFixed(1)}%
              </div>
              <Progress value={todayStats?.successRate || 0} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Último Envio
              </div>
              <div className="text-sm font-medium">
                {todayStats?.lastSubmission 
                  ? formatDistanceToNow(new Date(todayStats.lastSubmission), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })
                  : "Nenhum envio hoje"
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração da Chave IndexNow
          </CardTitle>
          <CardDescription>Gerencie sua chave de API do IndexNow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingKey ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : siteKey?.indexnow_key ? (
            <>
              <div className="space-y-2">
                <Label>Chave Atual</Label>
                <div className="flex gap-2">
                  <Input value={siteKey.indexnow_key} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={handleCopyKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleTestFile}>
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Testar Arquivo
                </Button>
                <Button variant="default" size="sm" onClick={() => validateKey()} disabled={isValidating}>
                  {isValidating && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                  Validar Chave
                </Button>
                {isKeyValidated && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                )}
                {isKeyValidated === false && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Não validado
                  </Badge>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Crie um arquivo chamado <code className="bg-muted px-1 rounded">{siteKey.indexnow_key}.txt</code> na 
                  raiz do seu site contendo apenas a chave acima. Exemplo: <code className="bg-muted px-1 rounded">{site.url}/{siteKey.indexnow_key}.txt</code>
                </AlertDescription>
              </Alert>

              <Button variant="outline" onClick={() => regenerateKey()} disabled={isRegenerating}>
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar Chave
                  </>
                )}
              </Button>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Nenhuma chave encontrada. Uma chave será gerada automaticamente.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Indexar URL Individual
          </CardTitle>
          <CardDescription>Envie uma URL específica para indexação via IndexNow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="singleUrl">URL Completa</Label>
              <Input
                id="singleUrl"
                type="url"
                placeholder={`https://${site.url}/sua-pagina`}
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitSingle()}
              />
            </div>
            <Button onClick={handleSubmitSingle} disabled={isSubmitting || !singleUrl.trim() || !siteKey?.indexnow_key}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Solicitar Indexação
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Páginas do Site</CardTitle>
              <CardDescription>Selecione páginas para indexação em lote via IndexNow</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {selectedPages.size > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedPages.size} de {pagesData?.totalCount || 0} selecionadas
                  </Badge>
                  <Button onClick={handleIndexSelected} size="sm" disabled={isSubmitting}>
                    <Zap className="h-4 w-4 mr-2" />
                    Indexar Selecionadas
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPages(new Set())}>
                    Limpar Seleção
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="🔍 Buscar por URL ou título..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="max-w-md flex-1"
            />

            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="submitted">Enviado com Sucesso</SelectItem>
                <SelectItem value="not_submitted">Não Enviado</SelectItem>
                <SelectItem value="error">Erro no Envio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page_url">URL (A-Z)</SelectItem>
                <SelectItem value="submitted_at_desc">Enviado (Mais Recente)</SelectItem>
                <SelectItem value="submitted_at_asc">Enviado (Mais Antigo)</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || sortBy !== "page_url" || statusFilter !== "all") && (
              <Button variant="ghost" onClick={() => { 
                setSearchTerm(""); 
                setSortBy("page_url"); 
                setStatusFilter("all");
                setCurrentPage(1); 
              }}>
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedPages.size === displayPages.length && displayPages.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Selecionar esta página ({displayPages.length} URLs)
              </span>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAllFromSite}
                disabled={!allPageIds || allPageIds.length === 0}
              >
                {selectAllMode === 'all' && selectedPages.size > 0
                  ? `✓ Todas selecionadas (${allPageIds?.length || 0})`
                  : `Selecionar TODAS as URLs (${allPageIds?.length || 0})`
                }
              </Button>
            </div>
            
            {selectedPages.size > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {selectedPages.size} selecionadas
                </Badge>
                
                {selectAllMode === 'all' && (
                  <Alert className="inline-flex items-center gap-2 py-1 px-3">
                    <Info className="h-3 w-3" />
                    <span className="text-xs">
                      Envio em lotes de 100 URLs
                    </span>
                  </Alert>
                )}
                
                <Button onClick={handleIndexSelected} size="sm" disabled={isSubmitting}>
                  <Zap className="h-4 w-4 mr-2" />
                  Indexar Selecionadas
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedPages(new Set());
                  setSelectAllMode('page');
                }}>
                  Limpar Seleção
                </Button>
              </div>
            )}
          </div>

          {isLoadingPages ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : displayPages.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Status IndexNow</TableHead>
                      <TableHead>Última Submissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayPages.map((page: any) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPages.has(page.id)}
                            onCheckedChange={() => handleTogglePage(page.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <a
                              href={page.page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm max-w-md truncate"
                            >
                              {page.page_url}
                            </a>
                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {page.page_title || "-"}
                        </TableCell>
                        <TableCell>
                          {page.indexnow_status === 'submitted' ? (
                            <Badge variant="outline" className="border-green-500 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Enviado
                            </Badge>
                          ) : page.indexnow_status === 'error' ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Erro
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Não Enviado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {page.last_indexnow_submission 
                            ? formatDistanceToNow(new Date(page.last_indexnow_submission), { addSuffix: true, locale: ptBR })
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => submitUrls({ urls: [page.page_url] })}
                            disabled={isSubmitting}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Indexar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagesData && pagesData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * PAGES_PER_PAGE) + 1} a {Math.min(currentPage * PAGES_PER_PAGE, pagesData.totalCount)} de {pagesData.totalCount} páginas
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Página {currentPage} de {pagesData.totalPages}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pagesData.totalPages, p + 1))} disabled={currentPage === pagesData.totalPages}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma página encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Submissões</CardTitle>
          <CardDescription>Últimas 50 tentativas de indexação via IndexNow</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>URLs Enviadas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Resposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.slice(0, 50).map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {submission.urls_count} URL{submission.urls_count > 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.status === 'success' ? (
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sucesso
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Erro
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {submission.status_code || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {submission.response_data || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma submissão encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

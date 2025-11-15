import { useState, useMemo } from 'react';
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
  Send
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("page_url");
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

  const { data: pages, isLoading: isLoadingPages } = useQuery({
    queryKey: ['site-pages-indexnow', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_pages')
        .select('id, page_url, page_title, created_at')
        .eq('site_id', siteId)
        .order('page_url', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: indexNowStatusData } = useQuery({
    queryKey: ['indexnow-pages-status', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indexnow_submissions')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const statusMap = new Map();
      data?.forEach(submission => {
        const payload = submission.request_payload as any;
        const urls = payload?.urlList || [];
        urls.forEach((url: string) => {
          if (!statusMap.has(url)) {
            statusMap.set(url, {
              status: submission.status,
              submitted_at: submission.created_at,
              response_data: submission.response_data,
            });
          }
        });
      });

      return statusMap;
    },
    enabled: !!siteId,
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

    submitUrls({ urls: [singleUrl] });
    setSingleUrl('');
  };

  const filteredAndSortedPages = useMemo(() => {
    if (!pages) return [];

    let filtered = pages;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.page_url.toLowerCase().includes(term) ||
        p.page_title?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(p => {
        const status = indexNowStatusData?.get(p.page_url);
        if (statusFilter === "submitted") return status?.status === 'success';
        if (statusFilter === "not_submitted") return !status;
        if (statusFilter === "error") return status?.status === 'error';
        return true;
      });
    }

    const sorted = [...filtered];
    if (sortBy === "page_url") {
      sorted.sort((a, b) => a.page_url.localeCompare(b.page_url));
    } else if (sortBy === "submitted_at_desc") {
      sorted.sort((a, b) => {
        const aDate = indexNowStatusData?.get(a.page_url)?.submitted_at || "";
        const bDate = indexNowStatusData?.get(b.page_url)?.submitted_at || "";
        return bDate.localeCompare(aDate);
      });
    } else if (sortBy === "submitted_at_asc") {
      sorted.sort((a, b) => {
        const aDate = indexNowStatusData?.get(a.page_url)?.submitted_at || "";
        const bDate = indexNowStatusData?.get(b.page_url)?.submitted_at || "";
        return aDate.localeCompare(bDate);
      });
    }

    return sorted;
  }, [pages, searchTerm, statusFilter, sortBy, indexNowStatusData]);

  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * PAGES_PER_PAGE;
    return filteredAndSortedPages.slice(start, start + PAGES_PER_PAGE);
  }, [filteredAndSortedPages, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedPages.length / PAGES_PER_PAGE);

  const handleSelectAll = () => {
    if (selectedPages.size === paginatedPages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(paginatedPages.map(p => p.id)));
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

    const selectedUrls = paginatedPages
      .filter(p => selectedPages.has(p.id))
      .map(p => p.page_url);

    await submitUrls({ urls: selectedUrls });
    setSelectedPages(new Set());
    toast.success(`${selectedUrls.length} URLs enviadas para indexação`);
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
                    {selectedPages.size} de {filteredAndSortedPages.length} selecionadas
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="submitted">Enviado</SelectItem>
                <SelectItem value="not_submitted">Não Enviado</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
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

            {(searchTerm || statusFilter !== "all" || sortBy !== "page_url") && (
              <Button variant="ghost" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setSortBy("page_url"); setCurrentPage(1); }}>
                Limpar Filtros
              </Button>
            )}
          </div>

          {isLoadingPages ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : paginatedPages.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedPages.size === paginatedPages.length && paginatedPages.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Status IndexNow</TableHead>
                      <TableHead>Última Submissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPages.map((page) => {
                      const status = indexNowStatusData?.get(page.page_url);
                      return (
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
                            {status?.status === 'success' ? (
                              <Badge variant="outline" className="border-green-500 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Enviado
                              </Badge>
                            ) : status?.status === 'error' ? (
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
                            {status?.submitted_at 
                              ? formatDistanceToNow(new Date(status.submitted_at), { addSuffix: true, locale: ptBR })
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * PAGES_PER_PAGE) + 1} a {Math.min(currentPage * PAGES_PER_PAGE, filteredAndSortedPages.length)} de {filteredAndSortedPages.length} páginas
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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

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
import { useGSCSitemaps } from '@/hooks/useGSCSitemaps';
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
  const [isLoadingSitemapUrls, setIsLoadingSitemapUrls] = useState(false);
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

  const { sitemaps, isLoading: isLoadingSitemaps } = useGSCSitemaps({ siteId });

  // Buscar páginas do site
  const { data: pages, isLoading: isLoadingPages } = useQuery({
    queryKey: ['site-pages-indexnow', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_pages')
        .select(`
          id,
          page_url,
          page_title,
          created_at
        `)
        .eq('site_id', siteId)
        .order('page_url', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar status IndexNow das páginas
  const { data: indexNowStatusData } = useQuery({
    queryKey: ['indexnow-pages-status', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indexnow_submissions')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear por URL para pegar última submissão
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

  const handleLoadFromSitemaps = async () => {
    if (!sitemaps || sitemaps.length === 0) {
      toast.error('Nenhum sitemap encontrado');
      return;
    }

    setIsLoadingSitemapUrls(true);
    try {
      const allUrls: string[] = [];
      
      for (const sitemap of sitemaps) {
        try {
          const response = await fetch(sitemap.sitemap_url);
          const text = await response.text();
          
          const urlMatches = text.match(/<loc>(.*?)<\/loc>/g);
          if (urlMatches) {
            const urls = urlMatches.map(match => 
              match.replace(/<\/?loc>/g, '')
            );
            allUrls.push(...urls);
          }
        } catch (error) {
          console.error(`Erro ao processar sitemap ${sitemap.sitemap_url}:`, error);
        }
      }

      if (allUrls.length > 0) {
        // Submeter URLs diretamente
        await submitUrls({ urls: allUrls });
        toast.success(`${allUrls.length} URLs dos sitemaps enviadas para indexação`);
      } else {
        toast.error('Nenhuma URL encontrada nos sitemaps');
      }
    } catch (error) {
      toast.error('Erro ao carregar URLs dos sitemaps');
    } finally {
      setIsLoadingSitemapUrls(false);
    }
  };

  // Filtrar e ordenar páginas
  const filteredAndSortedPages = useMemo(() => {
    if (!pages) return [];

    let filtered = pages;

    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.page_url.toLowerCase().includes(term) ||
        p.page_title?.toLowerCase().includes(term)
      );
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => {
        const status = indexNowStatusData?.get(p.page_url);
        if (statusFilter === "submitted") return status?.status === 'success';
        if (statusFilter === "not_submitted") return !status;
        if (statusFilter === "error") return status?.status === 'error';
        return true;
      });
    }

    // Ordenar
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

  // Paginação
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
      {/* Card 1: Informações IndexNow */}
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

      {/* Card 2: Configuração da Chave */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração da Chave IndexNow
          </CardTitle>
          <CardDescription>
            Gerencie sua chave de API do IndexNow
          </CardDescription>
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
                  <Input
                    value={siteKey.indexnow_key}
                    readOnly
                    className="font-mono text-sm"
                  />
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
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => validateKey()}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : null}
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
                  <div><strong>PASSO 1:</strong> Crie um arquivo chamado <code className="bg-blue-100 px-1 rounded">{siteKey?.indexnow_key}.txt</code></div>
                  <div><strong>PASSO 2:</strong> Cole este conteúdo no arquivo:</div>
                  <pre className="bg-blue-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                    {siteKey?.indexnow_key}
                  </pre>
                  <div><strong>PASSO 3:</strong> Hospede o arquivo na raiz do seu domínio:</div>
                  <code className="bg-blue-100 px-1 rounded">{site.url}/{siteKey?.indexnow_key}.txt</code>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (siteKey?.indexnow_key) {
                      const url = site.url.startsWith('http') ? site.url : `https://${site.url}`;
                      window.open(`${url}/${siteKey.indexnow_key}.txt`, '_blank');
                    }
                  }}
                  disabled={!siteKey?.indexnow_key}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Testar Arquivo
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => validateKey()}
                  disabled={isValidating || !siteKey?.indexnow_key}
                >
                  {isValidating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Validar Chave'
                  )}
                </Button>
                {isKeyValidated && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card de Indexação Rápida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Indexação Rápida
          </CardTitle>
          <CardDescription>
            Submeta uma URL individual para indexação imediata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="singleUrl">URL para Indexar</Label>
            <div className="flex gap-2">
              <Input
                id="singleUrl"
                type="url"
                placeholder={`https://${site.url}/sua-pagina`}
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitSingle()}
              />
              <Button onClick={handleSubmitSingle} disabled={isSubmitting || !singleUrl.trim()}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Indexar'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Indexação em Lote */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Indexação em Lote
          </CardTitle>
          <CardDescription>
            Submeta múltiplas URLs de uma vez (máximo 10.000 URLs)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="bulkUrls">URLs (uma por linha)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadFromSitemaps}
                disabled={isLoadingSitemapUrls || isLoadingSitemaps}
              >
                {isLoadingSitemapUrls ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Carregar dos Sitemaps
              </Button>
            </div>
            <Textarea
              id="bulkUrls"
              placeholder={`https://${site.url}/pagina-1\nhttps://${site.url}/pagina-2\nhttps://${site.url}/pagina-3`}
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {pages && pages.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Checkbox
                id="includeAllPages"
                checked={includeAllPages}
                onCheckedChange={(checked) => setIncludeAllPages(checked as boolean)}
              />
              <Label htmlFor="includeAllPages" className="cursor-pointer">
                Incluir todas as {pages.length} páginas registradas no site
              </Label>
            </div>
          )}

          <Button
            onClick={handleSubmitBulk}
            disabled={isSubmitting || (!bulkUrls.trim() && !includeAllPages)}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submetendo...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Submeter URLs em Lote
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Card de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Submissões
          </CardTitle>
          <CardDescription>
            Últimas 50 submissões ao IndexNow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma submissão realizada ainda</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>URLs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(submission.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.urls_count} URLs</Badge>
                      </TableCell>
                      <TableCell>
                        {submission.status === 'success' ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Sucesso</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Falha</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {submission.status_code ? `HTTP ${submission.status_code}` : '-'}
                        {submission.response_data && (
                          <div className="text-xs mt-1 truncate max-w-[200px]">
                            {submission.response_data}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

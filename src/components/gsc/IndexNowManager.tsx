import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
  RefreshCw
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
  const [bulkUrls, setBulkUrls] = useState('');
  const [includeAllPages, setIncludeAllPages] = useState(false);

  const { 
    submissions, 
    isLoading, 
    siteKey, 
    isLoadingKey,
    submitUrls, 
    isSubmitting,
    regenerateKey,
    isRegenerating 
  } = useIndexNow(siteId);

  // Buscar páginas do site
  const { data: pages } = useQuery({
    queryKey: ['site-pages', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_pages')
        .select('page_url')
        .eq('site_id', siteId);
      if (error) throw error;
      return data;
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
      alert(`A URL deve pertencer ao domínio: ${site.url}`);
      return;
    }

    if (!siteKey?.indexnow_key) {
      alert('Chave IndexNow não configurada. Aguarde a geração automática.');
      return;
    }

    submitUrls({ urls: [singleUrl] });
    setSingleUrl('');
  };

  const handleSubmitBulk = () => {
    if (!siteKey?.indexnow_key) {
      alert('Chave IndexNow não configurada. Aguarde a geração automática.');
      return;
    }

    let urlsToSubmit: string[] = [];

    if (includeAllPages && pages) {
      urlsToSubmit = pages.map(p => p.page_url);
    } else {
      const lines = bulkUrls.split('\n').filter(line => line.trim());
      urlsToSubmit = lines.filter(validateUrl);

      if (lines.length !== urlsToSubmit.length) {
        alert(`${lines.length - urlsToSubmit.length} URL(s) inválida(s) foram ignoradas`);
      }
    }

    if (urlsToSubmit.length === 0) {
      alert('Nenhuma URL válida para submeter');
      return;
    }

    submitUrls({ urls: urlsToSubmit });
    setBulkUrls('');
    setIncludeAllPages(false);
  };

  return (
    <div className="space-y-6">
      {/* Card Informativo */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Zap className="h-5 w-5" />
            O que é IndexNow?
          </CardTitle>
          <CardDescription className="text-blue-700">
            Protocolo que notifica instantaneamente os mecanismos de busca sobre atualizações no seu conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => (
              <Badge key={platform.name} className={`${platform.color} text-white`}>
                {platform.name}
              </Badge>
            ))}
          </div>
          <Alert className="bg-blue-100 border-blue-300">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Importante:</strong> Ao submeter uma URL ao IndexNow, ela é automaticamente compartilhada com TODOS os mecanismos de busca participantes!
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://www.indexnow.org', '_blank')}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação IndexNow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de Chave IndexNow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Sua Chave IndexNow
              </CardTitle>
              <CardDescription>
                Chave gerada automaticamente pelo sistema
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerateKey()}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingKey ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Chave Atual</Label>
                <div className="flex gap-2">
                  <Input
                    value={siteKey?.indexnow_key || 'Gerando...'}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (siteKey?.indexnow_key) {
                        navigator.clipboard.writeText(siteKey.indexnow_key);
                        toast.success('Chave copiada!');
                      }
                    }}
                    disabled={!siteKey?.indexnow_key}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 space-y-2">
                  <div><strong>PASSO 1:</strong> Crie um arquivo chamado <code className="bg-blue-100 px-1 rounded">{siteKey?.indexnow_key}.txt</code></div>
                  <div><strong>PASSO 2:</strong> Cole este conteúdo no arquivo:</div>
                  <pre className="bg-blue-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                    {siteKey?.indexnow_key}
                  </pre>
                  <div><strong>PASSO 3:</strong> Hospede o arquivo na raiz do seu domínio:</div>
                  <code className="bg-blue-100 px-1 rounded">{site.url}/{siteKey?.indexnow_key}.txt</code>
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (siteKey?.indexnow_key) {
                    const url = site.url.startsWith('http') ? site.url : `https://${site.url}`;
                    window.open(`${url}/${siteKey.indexnow_key}.txt`, '_blank');
                  }
                }}
                disabled={!siteKey?.indexnow_key}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Testar Arquivo de Verificação
              </Button>
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
            <Label htmlFor="bulkUrls">URLs (uma por linha)</Label>
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

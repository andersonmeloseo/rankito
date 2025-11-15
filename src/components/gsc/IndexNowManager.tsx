import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useIndexNow } from '@/hooks/useIndexNow';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export const IndexNowManager = ({ siteId, site }: IndexNowManagerProps) => {
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
      const siteHost = new URL(site.url).hostname;
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
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">IndexNow - Indexação Instantânea</CardTitle>
                <CardDescription className="text-base mt-1">
                  Submeta URLs para 7 plataformas simultaneamente
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-green-600 bg-green-50">
              <Check className="h-3 w-3 mr-1" />
              GRÁTIS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Como funciona:</strong> Ao submeter uma URL para o IndexNow, ela é automaticamente 
              compartilhada com <strong>todos os mecanismos de busca parceiros</strong>. Você só precisa 
              enviar para um endpoint!
            </AlertDescription>
          </Alert>

          <div>
            <p className="text-sm text-muted-foreground mb-3">
              <Globe className="h-4 w-4 inline mr-1" />
              Plataformas que receberão suas URLs:
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <Badge key={platform.name} variant="outline" className="gap-1">
                  <div className={`w-2 h-2 rounded-full ${platform.color}`} />
                  {platform.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <a
              href="https://www.indexnow.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Documentação oficial do IndexNow
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Configuração da API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração da API Key
          </CardTitle>
          <CardDescription>
            Obtenha sua chave gratuita em{' '}
            <a
              href="https://www.indexnow.org/faq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              indexnow.org
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key do IndexNow</Label>
            <Input
              id="api-key"
              type="text"
              placeholder="Exemplo: abc123def456..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="save-key"
              checked={saveKey}
              onCheckedChange={(checked) => setSaveKey(checked as boolean)}
            />
            <Label htmlFor="save-key" className="text-sm cursor-pointer">
              Salvar key permanentemente (localStorage)
            </Label>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <FileText className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>IMPORTANTE:</strong> Você deve hospedar o arquivo <code className="bg-yellow-100 px-1 rounded">{apiKey || '{sua-key}'}.txt</code> na 
              raiz do seu domínio: <code className="bg-yellow-100 px-1 rounded">{site.url}/{apiKey || '{sua-key}'}.txt</code>
              <br />
              <span className="text-xs mt-1 block">
                O conteúdo do arquivo deve ser apenas a sua API key.
              </span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Indexação Rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Indexação Rápida</CardTitle>
          <CardDescription>Submeter uma URL individual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="single-url">URL Completa</Label>
            <div className="flex gap-2">
              <Input
                id="single-url"
                type="url"
                placeholder={`${site.url}/exemplo-pagina`}
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitSingle()}
              />
              <Button
                onClick={handleSubmitSingle}
                disabled={isSubmitting || !singleUrl.trim() || !apiKey.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Indexar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indexação em Lote */}
      <Card>
        <CardHeader>
          <CardTitle>Indexação em Lote</CardTitle>
          <CardDescription>Submeter múltiplas URLs de uma vez (até 10.000)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-all"
              checked={includeAllPages}
              onCheckedChange={(checked) => setIncludeAllPages(checked as boolean)}
            />
            <Label htmlFor="include-all" className="cursor-pointer">
              Incluir todas as {pages?.length ?? 0} páginas cadastradas
            </Label>
          </div>

          {!includeAllPages && (
            <div className="space-y-2">
              <Label htmlFor="bulk-urls">URLs (uma por linha)</Label>
              <Textarea
                id="bulk-urls"
                placeholder={`${site.url}/pagina-1\n${site.url}/pagina-2\n${site.url}/pagina-3`}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {bulkUrls.split('\n').filter(line => line.trim()).length} URL(s) inserida(s)
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmitBulk}
            disabled={isSubmitting || !apiKey.trim() || (!includeAllPages && !bulkUrls.trim())}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submetendo...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Indexar Lote
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Submissões
          </CardTitle>
          <CardDescription>Últimas 50 submissões realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : submissions && submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="text-center">URLs</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Resposta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions?.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(submission.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {submission.urls_count}
                    </TableCell>
                    <TableCell className="text-center">
                      {submission.status === 'success' ? (
                        <Badge variant="default" className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Sucesso
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Falha
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {submission.status_code 
                        ? `HTTP ${submission.status_code}${submission.response_data ? `: ${submission.response_data}` : ''}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma submissão realizada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

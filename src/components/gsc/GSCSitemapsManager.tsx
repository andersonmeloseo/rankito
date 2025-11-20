import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Send, RotateCw, AlertCircle, History } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GSCSitemapsManagerProps {
  siteId: string;
  integrationId: string;
}

export function GSCSitemapsManager({ siteId, integrationId }: GSCSitemapsManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSitemaps, setSelectedSitemaps] = useState<string[]>([]);

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

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemap-history'] });
      toast.success(`${data.sitemaps.length} sitemaps sincronizados do GSC`);
    },
    onError: (error: any) => {
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

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Sucesso</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Pendente</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

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

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando sitemaps...
            </div>
          ) : sitemaps && sitemaps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSitemaps.length === sitemaps.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>URL do Sitemap</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Páginas</TableHead>
                  <TableHead>Status GSC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sitemaps.map((sitemap) => (
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
                    <TableCell>{sitemap.page_count || 0}</TableCell>
                    <TableCell>{getStatusBadge(sitemap.gsc_status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        <CardContent>
          {submissionHistory && submissionHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL do Sitemap</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Submissão</TableHead>
                  <TableHead>Último Download (Google)</TableHead>
                  <TableHead>Páginas</TableHead>
                  <TableHead>Erros</TableHead>
                  <TableHead>Avisos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionHistory.map((submission) => (
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
                    <TableCell>{submission.page_count || 0}</TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  );
}

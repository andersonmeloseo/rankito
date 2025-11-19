import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Send, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GSCSitemapsManagerProps {
  siteId: string;
  integrationId: string;
}

export function GSCSitemapsManager({ siteId, integrationId }: GSCSitemapsManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSitemaps, setSelectedSitemaps] = useState<string[]>([]);

  // Fetch sitemaps from database
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
      toast.success(`${data.sitemaps.length} sitemaps sincronizados do GSC`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao buscar sitemaps: ${error.message}`);
    },
  });

  // Process selected sitemaps
  const processSitemaps = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await supabase.functions.invoke('gsc-sitemaps-process', {
        body: { 
          site_id: siteId,
          sitemap_ids: selectedSitemaps,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps'] });
      
      // Verificar se há sitemaps que falharam
      if (data.failed_sitemaps && data.failed_sitemaps.length > 0) {
        toast.warning(
          `${data.urls_inserted} URLs descobertas de ${data.sitemaps_processed} sitemap(s). ⚠️ ${data.failed_sitemaps.length} sitemap(s) falharam (404 - não encontrados).`,
          { duration: 7000 }
        );
      } else {
        toast.success(
          `✅ ${data.urls_inserted} URLs descobertas de ${data.sitemaps_processed} sitemap(s) processado(s) com sucesso!`
        );
      }
      
      setSelectedSitemaps([]);
    },
    onError: (error: any) => {
      toast.error(`Erro ao processar sitemaps: ${error.message}`);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      success: { variant: "default", label: "Sucesso" },
      pending: { variant: "secondary", label: "Pendente" },
      error: { variant: "destructive", label: "Erro" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Sitemaps</CardTitle>
        <CardDescription>
          Busque sitemaps do Google Search Console e processe URLs para indexação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => fetchSitemaps.mutate()}
            disabled={fetchSitemaps.isPending}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${fetchSitemaps.isPending ? 'animate-spin' : ''}`} />
            Buscar Sitemaps no GSC
          </Button>
          
          {selectedSitemaps.length > 0 && (
            <Button
              onClick={() => processSitemaps.mutate()}
              disabled={processSitemaps.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Processar {selectedSitemaps.length} Selecionado(s)
            </Button>
          )}
        </div>

        {!sitemaps || sitemaps.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum sitemap encontrado. Clique em "Buscar Sitemaps no GSC" para sincronizar.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg">
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">URLs</TableHead>
                  <TableHead className="text-right">Erros</TableHead>
                  <TableHead className="text-right">Avisos</TableHead>
                  <TableHead>Última Submissão</TableHead>
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
                    <TableCell>
                      <a
                        href={sitemap.sitemap_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {sitemap.sitemap_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sitemap.sitemap_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(sitemap.gsc_status)}</TableCell>
                    <TableCell className="text-right">{sitemap.page_count || 0}</TableCell>
                    <TableCell className="text-right">
                      {sitemap.errors_count > 0 && (
                        <Badge variant="destructive">{sitemap.errors_count}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {sitemap.warnings_count > 0 && (
                        <Badge variant="secondary">{sitemap.warnings_count}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {sitemap.gsc_last_submitted 
                        ? new Date(sitemap.gsc_last_submitted).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

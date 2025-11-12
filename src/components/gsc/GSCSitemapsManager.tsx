import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useGSCSitemaps } from "@/hooks/useGSCSitemaps";
import { useDiscoverSitemaps } from "@/hooks/useDiscoverSitemaps";
import { useGSCIndexingQueue } from "@/hooks/useGSCIndexingQueue";
import { SitemapUrlsList } from "./SitemapUrlsList";
import { Plus, RefreshCw, Trash2, FileText, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Search, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GSCSitemapsManagerProps {
  integrationId: string;
  integrationName: string;
  siteId: string;
  userId: string;
}

export function GSCSitemapsManager({ integrationId, integrationName, siteId, userId }: GSCSitemapsManagerProps) {
  const [newSitemapUrl, setNewSitemapUrl] = useState("");
  const [showDiscovery, setShowDiscovery] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sitemapToDelete, setSitemapToDelete] = useState<string | null>(null);
  const [expandedSitemapUrls, setExpandedSitemapUrls] = useState<Set<string>>(new Set());

  const {
    sitemaps,
    isLoading,
    refetch,
    submitSitemap,
    deleteSitemap,
    isSubmitting,
    isDeleting,
  } = useGSCSitemaps({ integrationId });

  const {
    discoveredSitemaps,
    selectedSitemaps,
    expandedSitemaps,
    isDiscovering,
    isExpanding,
    isAutoDiscovering,
    discover,
    expandSitemap,
    autoDiscover,
    toggleSitemapSelection,
    toggleSelectAll,
    reset,
  } = useDiscoverSitemaps({ siteId, userId });

  const { addToQueue } = useGSCIndexingQueue({ integrationId });

  // Fetch site URL for auto-discovery
  const { data: siteData } = useQuery({
    queryKey: ['site-url', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_sites')
        .select('site_url')
        .eq('id', siteId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleDiscover = () => {
    if (!newSitemapUrl.trim()) return;
    discover(newSitemapUrl.trim());
  };

  const handleAutoDiscover = () => {
    if (!siteData?.site_url) return;
    autoDiscover(siteData.site_url);
  };

  const handleSubmitSelected = async () => {
    for (const sitemap of selectedSitemaps) {
      await submitSitemap.mutateAsync({ sitemap_url: sitemap.url });
    }
    reset();
  };

  const toggleExpandSitemap = (sitemapUrl: string) => {
    const newExpanded = new Set(expandedSitemapUrls);
    if (newExpanded.has(sitemapUrl)) {
      newExpanded.delete(sitemapUrl);
    } else {
      newExpanded.add(sitemapUrl);
      if (!expandedSitemaps[sitemapUrl]) {
        expandSitemap(sitemapUrl);
      }
    }
    setExpandedSitemapUrls(newExpanded);
  };

  const handleAddUrlsToQueue = (urls: string[]) => {
    addToQueue.mutate({
      urls: urls.map(url => ({ url })),
      distribution: urls.length > 200 ? 'even' : 'fast',
    });
  };

  const handleDeleteClick = (sitemapUrl: string) => {
    setSitemapToDelete(sitemapUrl);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sitemapToDelete) return;
    await deleteSitemap.mutateAsync({ sitemap_url: sitemapToDelete });
    setDeleteDialogOpen(false);
    setSitemapToDelete(null);
  };

  const getStatusBadge = (sitemap: any) => {
    if (sitemap.possibly_deleted) {
      return <Badge variant="outline" className="bg-gray-50"><XCircle className="h-3 w-3 mr-1" />Removido do GSC</Badge>;
    }
    
    if (sitemap.gsc_errors_count > 0) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro ({sitemap.gsc_errors_count})</Badge>;
    }
    
    if (sitemap.gsc_warnings_count > 0) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><AlertTriangle className="h-3 w-3 mr-1" />Aviso ({sitemap.gsc_warnings_count})</Badge>;
    }
    
    return <Badge variant="outline" className="border-green-500 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Sucesso</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sitemaps do {integrationName}
              </CardTitle>
              <CardDescription className="mt-2">
                Descubra, selecione e envie sitemaps ao Google Search Console
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Seção de Descoberta */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5" />
                Descobrir Sitemaps
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscovery(!showDiscovery)}
              >
                {showDiscovery ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>

            {showDiscovery && (
              <div className="space-y-4 p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="https://exemplo.com/sitemap.xml"
                      value={newSitemapUrl}
                      onChange={(e) => setNewSitemapUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
                    />
                  </div>
                  <Button
                    onClick={handleDiscover}
                    disabled={!newSitemapUrl.trim() || isDiscovering}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isDiscovering ? 'Descobrindo...' : 'Descobrir'}
                  </Button>
                  {siteData?.site_url && (
                    <Button
                      variant="outline"
                      onClick={handleAutoDiscover}
                      disabled={isAutoDiscovering}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isAutoDiscovering ? 'Buscando...' : 'Auto-Descobrir'}
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Sugestões: /sitemap.xml
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    /sitemap_index.xml
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    /wp-sitemap.xml
                  </Badge>
                </div>

                {discoveredSitemaps.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h4 className="font-semibold">
                          {discoveredSitemaps.length} sitemap{discoveredSitemaps.length > 1 ? 's' : ''} descoberto{discoveredSitemaps.length > 1 ? 's' : ''}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleSelectAll}
                        >
                          <Checkbox
                            checked={selectedSitemaps.length === discoveredSitemaps.length && discoveredSitemaps.length > 0}
                            className="mr-2"
                          />
                          {selectedSitemaps.length === discoveredSitemaps.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </Button>
                      </div>
                      {selectedSitemaps.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {selectedSitemaps.length} de {discoveredSitemaps.length} selecionados
                          </Badge>
                          <Button
                            onClick={handleSubmitSelected}
                            disabled={isSubmitting}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Enviando...' : `Enviar ${selectedSitemaps.length} ao GSC`}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="border rounded-lg overflow-hidden bg-background">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead className="text-right">URLs</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {discoveredSitemaps.map((sitemap) => (
                            <>
                              <TableRow key={sitemap.url}>
                                <TableCell>
                                  <Checkbox
                                    checked={sitemap.selected || false}
                                    onCheckedChange={() => toggleSitemapSelection(sitemap.url)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {sitemap.name}
                                </TableCell>
                                <TableCell>
                                  <a
                                    href={sitemap.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                                  >
                                    {sitemap.url.length > 60 ? sitemap.url.substring(0, 60) + '...' : sitemap.url}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {sitemap.urlCount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpandSitemap(sitemap.url)}
                                  >
                                    {expandedSitemapUrls.has(sitemap.url) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {expandedSitemapUrls.has(sitemap.url) && expandedSitemaps[sitemap.url] && (
                                <TableRow>
                                  <TableCell colSpan={5} className="p-0">
                                    <SitemapUrlsList
                                      urls={expandedSitemaps[sitemap.url]}
                                      sitemapName={sitemap.name}
                                      onAddToQueue={handleAddUrlsToQueue}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Seção de Sitemaps Submetidos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Sitemaps Submetidos ao GSC
            </h3>

          {sitemaps.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum sitemap submetido ainda</h3>
              <p className="text-muted-foreground mb-4">
                Use a ferramenta de descoberta acima para encontrar e enviar sitemaps ao GSC
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">URL do Sitemap</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">URLs Submetidas</TableHead>
                    <TableHead className="text-right">URLs Indexadas</TableHead>
                    <TableHead>Última Submissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sitemaps.map((sitemap) => (
                    <TableRow key={sitemap.sitemap_url}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <a
                            href={sitemap.sitemap_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {sitemap.sitemap_url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {sitemap.sitemap_type === 'index' ? 'Index' : 'Regular'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sitemap)}</TableCell>
                      <TableCell className="text-right">
                        {sitemap.urls_submitted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          {sitemap.urls_indexed.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(sitemap.gsc_last_submitted)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(sitemap.sitemap_url)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover sitemap do GSC?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o sitemap do Google Search Console e do banco de dados.
              O Google poderá continuar a processar URLs deste sitemap por algum tempo.
              <br /><br />
              <strong>Sitemap:</strong> {sitemapToDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

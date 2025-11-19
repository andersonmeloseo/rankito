import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGSCSitemaps } from "@/hooks/useGSCSitemaps";
import { useDiscoverSitemaps } from "@/hooks/useDiscoverSitemaps";
import { useGSCIndexingQueue } from "@/hooks/useGSCIndexingQueue";
import { Search, FileText, Trash2, Loader2, Send, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GSCSitemapsManagerProps {
  siteId: string;
  userId: string;
}

export function GSCSitemapsManager({ siteId, userId }: GSCSitemapsManagerProps) {
  const { toast } = useToast();
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { sitemaps, isLoading, submitSitemap } = useGSCSitemaps({ siteId });
  const { addToQueue } = useGSCIndexingQueue({ siteId });

  const {
    discoveredSitemaps,
    isDiscovering,
    discover,
    toggleSitemapSelection,
    toggleSelectAll,
    removeSitemap,
    reset,
  } = useDiscoverSitemaps({ siteId, userId });

  const handleDiscover = () => {
    if (!sitemapUrl.trim()) return;
    discover(sitemapUrl.trim());
    setSitemapUrl("");
  };

  const handleSubmitSelected = async () => {
    const selectedSitemaps = discoveredSitemaps.filter(s => s.selected);
    if (selectedSitemaps.length === 0) return;

    setIsSubmitting(true);

    try {
      // Coletar todas as URLs dos sitemaps selecionados
      let allUrls: string[] = [];
      
      for (const sitemap of selectedSitemaps) {
        try {
          const response = await fetch(sitemap.url);
          const text = await response.text();
          
          // Extrair URLs usando regex
          const urlMatches = text.match(/<loc>\s*([^<]+)\s*<\/loc>/g);
          if (urlMatches) {
            const urls = urlMatches.map(match => 
              match.replace(/<\/?loc>/g, '').trim()
            );
            console.log(`🔍 URLs extraídas de ${sitemap.name}:`, urls.length);
            allUrls = [...allUrls, ...urls];
          }
        } catch (error) {
          console.error("Erro ao buscar URLs do sitemap:", sitemap.name, error);
        }
      }

      if (allUrls.length === 0) {
        toast({
          title: "❌ Nenhuma URL encontrada",
          description: "Não foi possível extrair URLs dos sitemaps selecionados",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Remover duplicatas dentro do array
      const uniqueUrls = Array.from(new Set(allUrls));
      const duplicatesRemoved = allUrls.length - uniqueUrls.length;

      if (duplicatesRemoved > 0) {
        console.log(`🔄 ${duplicatesRemoved} URLs duplicadas removidas`);
      }

      console.log(`📤 [GSCSitemapsManager] Enviando ${uniqueUrls.length} URLs únicas para distribuição`);
      console.log(`📋 [GSCSitemapsManager] Primeiras 5 URLs:`, uniqueUrls.slice(0, 5));

      // Adicionar URLs à fila de indexação
      console.log(`🔄 [GSCSitemapsManager] Chamando addToQueue.mutateAsync...`);
      
      try {
        const result = await addToQueue.mutateAsync({
          urls: uniqueUrls.map(url => ({ url }))
        });

        console.log(`✅ [GSCSitemapsManager] addToQueue completou com sucesso:`, result);
        
        // Reset é feito no onSuccess da mutação
        reset();
      } catch (mutationError) {
        console.error(`❌ [GSCSitemapsManager] addToQueue.mutateAsync FALHOU:`, {
          error: mutationError,
          message: mutationError instanceof Error ? mutationError.message : 'Unknown',
          stack: mutationError instanceof Error ? mutationError.stack : undefined
        });
        throw mutationError; // Re-throw para ser capturado pelo catch externo
      }
    } catch (error) {
      console.error("❌ [GSCSitemapsManager] ERRO COMPLETO ao processar sitemaps:", {
        error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      
      toast({
        title: "❌ Erro ao processar",
        description: error instanceof Error ? error.message : "Erro desconhecido ao adicionar URLs à fila",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSitemaps = discoveredSitemaps.filter(s => s.selected);
  const totalSelectedUrls = selectedSitemaps.reduce((sum, s) => sum + s.urlCount, 0);
  const allSelected = discoveredSitemaps.length > 0 && selectedSitemaps.length === discoveredSitemaps.length;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Sucesso</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="h-3 w-3 mr-1" />Avisos</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">Processando</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-6">{/* Wrapper para múltiplos cards */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Descobrir Sitemaps
        </CardTitle>
        <CardDescription>
          Insira a URL do sitemap index do seu site para descobrir todos os sitemaps disponíveis
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input + Botão Descobrir */}
        <div className="flex gap-2">
          <Input 
            placeholder="https://seusite.com/sitemap_index.xml"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
          />
          <Button 
            onClick={handleDiscover} 
            disabled={!sitemapUrl.trim() || isDiscovering}
          >
            {isDiscovering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Descobrindo...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Descobrir
              </>
            )}
          </Button>
        </div>

        {/* Tabela de Sitemaps Descobertos */}
        {discoveredSitemaps.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Sitemaps Encontrados ({discoveredSitemaps.length})
                </h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitSelected}
                    disabled={selectedSitemaps.length === 0 || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Adicionar {selectedSitemaps.length} à Fila
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Todos
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>URLs</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {discoveredSitemaps.map((sitemap) => (
                    <TableRow key={sitemap.url}>
                      <TableCell>
                        <Checkbox 
                          checked={sitemap.selected}
                          onCheckedChange={() => toggleSitemapSelection(sitemap.url)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {sitemap.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sitemap.urlCount.toLocaleString()} URLs
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSitemap(sitemap.url)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover sitemap</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Footer com Resumo */}
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground text-center">
                  {selectedSitemaps.length > 0 ? (
                    <>
                      <strong>{selectedSitemaps.length}</strong> sitemaps selecionados
                      {' • '}
                      <strong>{totalSelectedUrls.toLocaleString()}</strong> URLs totais
                    </>
                  ) : (
                    'Nenhum sitemap selecionado'
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {discoveredSitemaps.length === 0 && !isDiscovering && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              Insira a URL do sitemap acima para começar a descoberta
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Histórico de Sitemaps Enviados ao GSC */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Sitemaps Enviados ao GSC
        </CardTitle>
        <CardDescription>
          Histórico de sitemaps submetidos ao Google Search Console
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : sitemaps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              Nenhum sitemap enviado ao GSC ainda
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL do Sitemap</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URLs</TableHead>
                <TableHead>Último Envio</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sitemaps.map((sitemap) => (
                <TableRow key={sitemap.id}>
                  <TableCell className="font-medium max-w-md truncate">
                    {sitemap.sitemap_url}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(sitemap.gsc_status)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sitemap.urls_indexed?.toLocaleString() || 0} / {sitemap.urls_submitted?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(sitemap.gsc_last_submitted)}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(sitemap.sitemap_url, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Abrir sitemap</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </div>
  );
}

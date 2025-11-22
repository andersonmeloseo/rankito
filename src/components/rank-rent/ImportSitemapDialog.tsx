import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errorMessages";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Loader2, CheckCircle2, Download, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportSitemapDialogProps {
  siteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportSitemapDialog = ({ siteId, open, onOpenChange }: ImportSitemapDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: limits } = useSubscriptionLimits();
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  
  // Discovery mode state
  const [discoverMode, setDiscoverMode] = useState(true);
  const [discoveredSitemaps, setDiscoveredSitemaps] = useState<any[]>([]);
  const [selectedSitemaps, setSelectedSitemaps] = useState<string[]>([]);
  const [discovering, setDiscovering] = useState(false);
  
  // URL visualization state
  const [showAllUrls, setShowAllUrls] = useState(false);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

  const resetState = () => {
    setResult(null);
    setProgress(0);
    setLoading(false);
    setSitemapUrl("");
    setDiscoverMode(true);
    setDiscoveredSitemaps([]);
    setSelectedSitemaps([]);
    setShowAllUrls(false);
    setShowDuplicatesOnly(false);
  };

  const handleDownloadUrls = (urlsToExport: string[], filename: string) => {
    const content = urlsToExport.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDiscoverSitemaps = async () => {
    if (!sitemapUrl) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira a URL do sitemap primeiro",
        variant: "destructive"
      });
      return;
    }

    setDiscovering(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke("discover-sitemaps", {
        body: {
          sitemap_url: sitemapUrl,
          site_id: siteId,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      setDiscoveredSitemaps(data.sitemaps || []);
      
      // Auto-select all by default
      setSelectedSitemaps(data.sitemaps.map((s: any) => s.url));
      
      setDiscoverMode(false);

      toast({
        title: "✅ Sitemaps Descobertos!",
        description: `${data.totalSitemaps} sitemaps encontrados com ${data.totalUrls.toLocaleString()} URLs no total`,
      });
    } catch (error: any) {
      console.error("Erro ao descobrir sitemaps:", error);
      const errorMsg = getErrorMessage(error, 'descobrir sitemaps');
      toast({
        title: errorMsg.title,
        description: `${errorMsg.description}${errorMsg.action ? `\n\n💡 ${errorMsg.action}` : ''}`,
        variant: "destructive",
      });
    } finally {
      setDiscovering(false);
    }
  };

  const toggleSitemap = (url: string) => {
    setSelectedSitemaps(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSitemaps.length === discoveredSitemaps.length) {
      setSelectedSitemaps([]);
    } else {
      setSelectedSitemaps(discoveredSitemaps.map(s => s.url));
    }
  };

  const handleImportSelected = async () => {
    if (selectedSitemaps.length === 0) {
      toast({
        title: "Nenhum sitemap selecionado",
        description: "Por favor, selecione pelo menos um sitemap para importar",
        variant: "destructive"
      });
      return;
    }

    // Validar limite de páginas ANTES de importar
    const totalUrlsToImport = discoveredSitemaps
      .filter(s => selectedSitemaps.includes(s.url))
      .reduce((sum, s) => sum + s.urlCount, 0);
    
    const currentPages = limits?.currentUsage.pagesPerSite[siteId] || 0;
    const maxPages = limits?.plan?.max_pages_per_site;
    
    if (maxPages && (currentPages + totalUrlsToImport) > maxPages) {
      const available = maxPages - currentPages;
      toast({
        title: "⚠️ Limite de páginas excedido",
        description: `Este import adicionaria ${totalUrlsToImport} páginas, mas você só tem ${available} disponíveis no seu plano ${limits?.plan?.name}. Faça upgrade para continuar.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setProgress(10);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const totalExpectedUrls = discoveredSitemaps
        .filter(s => selectedSitemaps.includes(s.url))
        .reduce((sum, s) => sum + s.urlCount, 0);

      const { data, error } = await supabase.functions.invoke("import-sitemap", {
        body: {
          site_id: siteId,
          sitemap_url: sitemapUrl,
          selected_sitemaps: selectedSitemaps, // Pass selected sitemaps
          is_final_batch: true, // Deactivate old pages
          import_job_id: null,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      // ✅ FASE 1: Validar URLs descobertas automaticamente
      if (data?.newPages > 0) {
        try {
          const { data: site } = await supabase
            .from('rank_rent_sites')
            .select('site_url')
            .eq('id', siteId)
            .single();

          if (site?.site_url) {
            // Buscar URLs recém-descobertas sem validação
            const { data: urlsToValidate } = await supabase
              .from('gsc_discovered_urls')
              .select('url')
              .eq('site_id', siteId)
              .is('validation_status', null)
              .limit(100);

            if (urlsToValidate && urlsToValidate.length > 0) {
              await supabase.functions.invoke('gsc-validate-urls', {
                body: {
                  site_id: siteId,
                  urls: urlsToValidate.map(u => u.url)
                }
              });
            }
          }
        } catch (validationError) {
          console.error('Erro ao validar URLs:', validationError);
          // Não bloqueia importação se validação falhar
        }
      }

      // Add expected URLs to result
      data.expectedUrls = totalExpectedUrls;
      data.selectedSitemapsCount = selectedSitemaps.length;

      // Verificar se limite foi atingido
      if (data?.limitReached || data?.planInfo?.limitReached) {
        toast({
          variant: "destructive",
          title: "🚫 Limite de Páginas Atingido",
          description: data?.message || `Seu plano ${data?.planName || ''} permite ${data?.maxPages || 0} páginas. Você já tem ${data?.currentPages || 0} cadastradas.`,
          duration: 8000,
        });
      }

      setResult(data);
      setProgress(90);

      const stats = [
        `📊 ${data.selectedSitemapsCount}/${discoveredSitemaps.length} sitemaps`,
        `🔗 ${data.expectedUrls} URLs esperadas`,
        `✨ ${data.newPages} novas`,
        `🔄 ${data.updatedPages} atualizadas`,
      ];

      if (data.deactivatedPages > 0) {
        stats.push(`⚠️ ${data.deactivatedPages} desativadas`);
      }

      toast({
        title: "✅ Importação Concluída!",
        description: stats.join(' • '),
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-pages"] });

      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao importar:", error);
      
      let errorMessage = error instanceof Error ? error.message : "Não foi possível importar o sitemap";
      
      if (error.message?.includes('Limite de')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro na Importação",
        description: errorMessage,
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In discovery mode, trigger discovery instead of import
    if (discoverMode) {
      await handleDiscoverSitemaps();
    } else {
      await handleImportSelected();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Sitemap</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {discoverMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="sitemap-url">URL do Sitemap</Label>
                <Input
                  id="sitemap-url"
                  type="url"
                  placeholder="https://seusite.com/sitemap_index.xml"
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  disabled={discovering}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Cole a URL do sitemap_index.xml ou sitemap.xml do seu site
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={discovering || !sitemapUrl} 
                className="w-full"
              >
                {discovering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Descobrindo Sitemaps...
                  </>
                ) : (
                  "🔍 Descobrir Sitemaps"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sitemaps Disponíveis</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDiscoverMode(true);
                      setDiscoveredSitemaps([]);
                      setSelectedSitemaps([]);
                    }}
                  >
                    ← Voltar
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedSitemaps.length === discoveredSitemaps.length && discoveredSitemaps.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Sitemap</TableHead>
                        <TableHead className="text-right">URLs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discoveredSitemaps.map((sitemap) => (
                        <TableRow key={sitemap.url}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSitemaps.includes(sitemap.url)}
                              onCheckedChange={() => toggleSitemap(sitemap.url)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {sitemap.name}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {sitemap.urlCount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de Sitemaps:</span>
                    <span className="font-semibold">{discoveredSitemaps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selecionados:</span>
                    <span className="font-semibold">{selectedSitemaps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">URLs a Importar:</span>
                    <span className="font-semibold">
                      {discoveredSitemaps
                        .filter(s => selectedSitemaps.includes(s.url))
                        .reduce((sum, s) => sum + s.urlCount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={loading || selectedSitemaps.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  `📥 Importar ${selectedSitemaps.length} Sitemap(s) Selecionado(s)`
                )}
              </Button>
            </>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Importando páginas dos sitemaps selecionados...
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* ALERT: Limite de Páginas Atingido */}
              {(result.limitReached || result.planInfo?.limitReached) && (
                <Alert variant="destructive" className="mb-6 border-2 border-destructive">
                  <AlertCircle className="h-6 w-6" />
                  <AlertTitle className="text-lg font-bold">
                    🚫 Limite de Páginas Atingido
                  </AlertTitle>
                  <AlertDescription className="space-y-3">
                    <div className="text-sm mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-3 p-3 bg-destructive/10 rounded-md">
                        <div>
                          <span className="font-semibold text-xs text-muted-foreground">Plano Atual:</span>
                          <div className="font-bold text-lg">{result.planInfo?.name || result.planName || 'Desconhecido'}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-muted-foreground">Limite:</span>
                          <div className="font-bold text-lg">
                            {result.planInfo?.isUnlimited ? '∞ Ilimitado' : `${result.planInfo?.maxPages || result.maxPages || 0} páginas`}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-muted-foreground">Páginas Cadastradas:</span>
                          <div className="font-bold text-lg text-destructive">
                            {result.planInfo?.currentPages || result.currentPages || 0}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-muted-foreground">URLs Bloqueadas:</span>
                          <div className="font-bold text-lg text-orange-600 dark:text-orange-400">
                            {result.pagesBlocked || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border-2 border-amber-400">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        💡 Faça upgrade para o plano <strong>Enterprise</strong> e tenha páginas ilimitadas!
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* CARDS PRINCIPAIS - DESTAQUE MÁXIMO */}
              <div className="grid grid-cols-2 gap-4">
                {/* Card: Total de URLs */}
                <div className="p-6 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <div className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-2">
                    🔍 Total de URLs Encontradas
                  </div>
                  <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                    {result.totalUrlsFoundInSitemap?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    URLs brutas do sitemap
                  </div>
                </div>

                {/* Card: Páginas Únicas */}
                <div className={`p-6 rounded-lg border-2 ${
                  result.pagesBlocked > 0 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
                    : 'border-green-500 bg-green-50 dark:bg-green-950/20'
                }`}>
                  <div className={`text-sm font-medium mb-2 ${
                    result.pagesBlocked > 0 
                      ? 'text-orange-700 dark:text-orange-400' 
                      : 'text-green-700 dark:text-green-400'
                  }`}>
                    {result.pagesBlocked > 0 ? '⚠️' : '✅'} Páginas Únicas Importadas
                  </div>
                  <div className={`text-4xl font-bold ${
                    result.pagesBlocked > 0 
                      ? 'text-orange-900 dark:text-orange-100' 
                      : 'text-green-900 dark:text-green-100'
                  }`}>
                    {result.uniqueUrls?.toLocaleString() || 0}
                  </div>
                  <div className={`text-xs mt-1 ${
                    result.pagesBlocked > 0 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {result.pagesBlocked > 0 
                      ? `⚠️ ${result.pagesBlocked} bloqueadas pelo limite do plano` 
                      : 'Após remoção de duplicatas'
                    }
                  </div>
                </div>
              </div>

              {/* Card: Informações do Plano */}
              {result.planInfo && (
                <div className={`p-4 rounded-lg border-2 ${
                  result.planInfo.limitReached 
                    ? 'bg-destructive/10 border-destructive' 
                    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Plano Atual</div>
                      <div className="text-lg font-bold">{result.planInfo.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-muted-foreground">Páginas</div>
                      <div className={`text-lg font-bold ${result.planInfo.limitReached ? 'text-destructive' : 'text-blue-900 dark:text-blue-100'}`}>
                        {result.planInfo.currentPages} / {result.planInfo.isUnlimited ? '∞' : result.planInfo.maxPages}
                      </div>
                    </div>
                  </div>
                  
                  {result.planInfo.limitReached && (
                    <Badge variant="destructive" className="mt-2 w-full justify-center py-1">
                      🚫 LIMITE ATINGIDO
                    </Badge>
                  )}
                </div>
              )}

              {/* Card: Duplicatas (se houver) */}
              {result.duplicatesRemoved > 0 && (
                <Alert className="border-orange-400 bg-orange-50 dark:bg-orange-950/20">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <AlertDescription>
                    <div className="font-semibold text-orange-900 dark:text-orange-100">
                      {result.duplicatesRemoved} URLs duplicadas foram removidas
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      {result.totalUrlsFoundInSitemap} URLs encontradas → {result.uniqueUrls} páginas únicas 
                      = {result.duplicatesRemoved} duplicatas removidas
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* ✅ CORREÇÃO 6: Mostrar URLs que falharam */}
              {result.failedUrlsList && result.failedUrlsList.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription>
                    <div className="font-semibold">
                      ⚠️ {result.failedUrlsList.length} URLs falharam ao importar
                    </div>
                    <Collapsible>
                      <CollapsibleTrigger className="text-sm underline mt-2 hover:opacity-80">
                        Ver URLs com erro
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ScrollArea className="h-48 mt-2 rounded-md border">
                          <div className="p-2 space-y-2">
                            {result.failedUrlsList.map((fail: any, idx: number) => (
                              <div key={idx} className="text-xs font-mono p-2 rounded bg-background/50 border">
                                <div className="text-destructive font-semibold break-all">{fail.url}</div>
                                <div className="text-muted-foreground mt-1">{fail.error}</div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CollapsibleContent>
                    </Collapsible>
                  </AlertDescription>
                </Alert>
              )}

              {/* Detalhes Adicionais (colapsável) */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    📊 Ver Detalhes Adicionais
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 space-y-2 text-sm p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sitemaps Selecionados:</span>
                      <span className="font-medium">{result.selectedSitemapsCount}/{discoveredSitemaps.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Páginas Novas:</span>
                      <span className="font-medium text-green-600">✨ {result.newPages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Páginas Atualizadas:</span>
                      <span className="font-medium text-blue-600">🔄 {result.updatedPages}</span>
                    </div>
                    {result.deactivatedPages > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Páginas Desativadas:</span>
                        <span className="font-medium text-orange-600">⚠️ {result.deactivatedPages}</span>
                      </div>
                    )}
                    {result.pagesFailedToInsert > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">URLs com Erro:</span>
                        <span className="font-medium text-destructive">❌ {result.pagesFailedToInsert}</span>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* URL Visualization Section */}
              {result.allRawUrls && result.allRawUrls.length > 0 && (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={showAllUrls && !showDuplicatesOnly ? "default" : "outline"}
                      onClick={() => {
                        setShowAllUrls(true);
                        setShowDuplicatesOnly(false);
                      }}
                    >
                      📋 Ver Todas ({result.allRawUrls.length})
                    </Button>
                    
                    {result.duplicatesRemoved > 0 && (
                      <Button
                        size="sm"
                        variant={showDuplicatesOnly ? "default" : "outline"}
                        onClick={() => {
                          setShowAllUrls(true);
                          setShowDuplicatesOnly(true);
                        }}
                      >
                        🔍 Ver Apenas Duplicatas ({result.duplicatesRemoved})
                      </Button>
                    )}
                    
                    {showAllUrls && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAllUrls(false)}
                      >
                        ✕ Fechar
                      </Button>
                    )}
                    
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadUrls(
                          result.allRawUrls, 
                          'todas-urls.txt'
                        )}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Todas
                      </Button>
                      
                      {result.duplicatesRemoved > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadUrls(
                            result.duplicateUrlsList, 
                            'duplicatas.txt'
                          )}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download Duplicatas
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {showAllUrls && (
                    <>
                      <ScrollArea className="h-[400px] w-full border rounded-md">
                        <div className="p-4 space-y-1">
                          {(showDuplicatesOnly 
                            ? result.duplicateUrlsList 
                            : result.allRawUrls
                          ).map((url: string, index: number) => {
                            const isDuplicate = result.duplicateUrlsList?.includes(url);
                            return (
                              <div
                                key={index}
                                className={cn(
                                  "text-xs p-2 rounded font-mono break-all",
                                  isDuplicate && !showDuplicatesOnly 
                                    ? "bg-orange-50 text-orange-700 border-l-2 border-orange-400 dark:bg-orange-950/30 dark:text-orange-300" 
                                    : "bg-muted"
                                )}
                              >
                                {isDuplicate && !showDuplicatesOnly && (
                                  <span className="text-orange-500 mr-2">⚠️ DUPLICATA</span>
                                )}
                                {url}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      
                      <p className="text-xs text-muted-foreground">
                        {showDuplicatesOnly 
                          ? `Mostrando ${result.duplicatesRemoved} URLs duplicadas que foram removidas`
                          : `Mostrando todas as ${result.allRawUrls.length} URLs encontradas ${result.duplicatesRemoved > 0 ? '(duplicatas marcadas em laranja)' : ''}`
                        }
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

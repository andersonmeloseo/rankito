import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportSitemapDialogProps {
  siteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportSitemapDialog = ({ siteId, open, onOpenChange }: ImportSitemapDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      toast({
        title: "Erro na Descoberta",
        description: error.message || "Não foi possível descobrir os sitemaps",
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

      // Add expected URLs to result
      data.expectedUrls = totalExpectedUrls;
      data.selectedSitemapsCount = selectedSitemaps.length;

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
              <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">✅ Importação Concluída!</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sitemaps Selecionados:</span>
                    <span className="font-medium">{result.selectedSitemapsCount}/{discoveredSitemaps.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">URLs Encontradas:</span>
                    <span className="font-medium">{result.allRawUrls?.length?.toLocaleString()}</span>
                  </div>
                  {result.duplicatesRemoved > 0 && (
                    <div className="flex justify-between">
                      <span className="text-orange-600">Duplicatas Removidas:</span>
                      <span className="font-medium text-orange-600">-{result.duplicatesRemoved}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-green-600 font-semibold">URLs Únicas Importadas:</span>
                    <span className="font-semibold text-green-600">{result.uniqueUrls?.toLocaleString()}</span>
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
                </div>
              </div>

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

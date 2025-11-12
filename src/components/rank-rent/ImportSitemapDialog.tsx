import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { FileText, AlertCircle } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const sitemapsPerBatch = 30; // Fixo: processar 30 sitemaps de uma vez
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalSitemapsFound, setTotalSitemapsFound] = useState(0);
  const [importJobId, setImportJobId] = useState<string | null>(null);

  const resetState = () => {
    setSitemapUrl("");
    setProgress(0);
    setResult(null);
    setCurrentOffset(0);
    setTotalSitemapsFound(0);
    setImportJobId(null);
  };

  const handleFullReimport = async () => {
    if (!sitemapUrl) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira a URL do sitemap primeiro",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setProgress(10);
    setResult(null);
    setCurrentOffset(0);
    setImportJobId(null);

    try {
      setProgress(30);

      const { data: { user } } = await supabase.auth.getUser();

      // Forçar importação completa: processar TUDO e desativar antigas
      const { data, error } = await supabase.functions.invoke("import-sitemap", {
        body: {
          site_id: siteId,
          sitemap_url: sitemapUrl,
          max_sitemaps: 100, // Processar até 100 sitemaps de uma vez
          sitemap_offset: 0,
          is_final_batch: true, // SEMPRE desativar páginas antigas
          import_job_id: null, // Nova importação
          user_id: user?.id,
        },
      });

      setProgress(90);

      if (error) throw error;

      setResult(data);
      setProgress(100);

      const stats = [
        `📊 ${data.sitemapsProcessed}/${data.totalSitemapsFound} sitemaps processados`,
        `🔗 ${data.totalUrlsFound} URLs encontradas`,
        `✨ ${data.newPages} novas`,
        `🔄 ${data.updatedPages} atualizadas`,
      ];

      if (data.deactivatedPages > 0) {
        stats.push(`⚠️ ${data.deactivatedPages} desativadas`);
      }

      toast({
        title: "✅ Reimportação Completa!",
        description: stats.join(' • '),
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-pages"] });

      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao reimportar:", error);
      
      let errorMessage = error instanceof Error ? error.message : "Não foi possível reimportar o sitemap";
      
      if (error.message?.includes('Limite de')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro na Reimportação",
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

    // Validar limite antes de importar
    if (!limits?.canCreatePage(siteId) && !limits?.isUnlimited) {
      toast({
        title: "Limite de páginas atingido",
        description: `Seu plano ${limits?.plan?.name} permite ${limits?.plan?.max_pages_per_site} páginas por site.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setProgress(10);
    setResult(null);

    try {
      setProgress(30);

      // Buscar user_id
      const { data: { user } } = await supabase.auth.getUser();
      
      const isFinalBatch = totalSitemapsFound === 0 || (currentOffset + sitemapsPerBatch) >= totalSitemapsFound;

      const { data, error } = await supabase.functions.invoke("import-sitemap", {
        body: {
          site_id: siteId,
          sitemap_url: sitemapUrl,
          max_sitemaps: sitemapsPerBatch,
          sitemap_offset: currentOffset,
          is_final_batch: isFinalBatch,
          import_job_id: importJobId,
          user_id: user?.id,
        },
      });

      setProgress(90);

      if (error) throw error;

      setResult(data);
      if (data.import_job_id && !importJobId) {
        setImportJobId(data.import_job_id);
      }
      if (data.totalSitemapsFound) {
        setTotalSitemapsFound(data.totalSitemapsFound);
      }
      setProgress(100);

      const totalProcessedSoFar = currentOffset + data.sitemapsProcessed;
      
      const stats = [
        `📊 ${totalProcessedSoFar} de ${data.totalSitemapsFound} sitemaps processados`,
        `🔗 ${data.totalUrlsFound} URLs encontradas neste lote`,
        `✨ ${data.newPages} páginas novas`,
        `🔄 ${data.updatedPages} páginas atualizadas`,
      ];
      
      if (data.deactivatedPages > 0) {
        stats.push(`⚠️ ${data.deactivatedPages} páginas desativadas`);
      }
      
      if (data.limited) {
        stats.push(`⚡ Limite de ${data.urlsImported} URLs aplicado`);
      }

      const isComplete = totalProcessedSoFar >= data.totalSitemapsFound;

      toast({
        title: isComplete ? "✅ Importação Completa!" : "✅ Lote Processado!",
        description: stats.join(' • '),
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-pages"] });
      
      if (isComplete) {
        setTimeout(() => {
          onOpenChange(false);
          resetState();
        }, 3000);
      }
    } catch (error: any) {
      console.error("Erro ao importar sitemap:", error);
      
      let errorMessage = error instanceof Error ? error.message : "Não foi possível importar o sitemap";
      
      // Detectar erro de limite do trigger
      if (error.message?.includes('Limite de')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueImport = async () => {
    const newOffset = currentOffset + sitemapsPerBatch;
    setCurrentOffset(newOffset);
    setLoading(true);
    setProgress(10);
    
    try {
      const isFinalBatch = (newOffset + sitemapsPerBatch) >= totalSitemapsFound;

      const { data, error } = await supabase.functions.invoke("import-sitemap", {
        body: {
          site_id: siteId,
          sitemap_url: sitemapUrl,
          max_sitemaps: sitemapsPerBatch,
          sitemap_offset: newOffset,
          is_final_batch: isFinalBatch,
          import_job_id: importJobId,
        },
      });

      setProgress(90);

      if (error) throw error;

      setResult(data);
      setProgress(100);

      const totalProcessedSoFar = newOffset + data.sitemapsProcessed;
      
      const stats = [
        `📊 ${totalProcessedSoFar} de ${data.totalSitemapsFound} sitemaps processados`,
        `🔗 ${data.totalUrlsFound} URLs encontradas neste lote`,
        `✨ ${data.newPages} páginas novas`,
        `🔄 ${data.updatedPages} páginas atualizadas`,
      ];

      if (data.deactivatedPages > 0) {
        stats.push(`⚠️ ${data.deactivatedPages} páginas desativadas`);
      }

      const isComplete = totalProcessedSoFar >= data.totalSitemapsFound;

      toast({
        title: isComplete ? "✅ Importação Completa!" : "✅ Lote Processado!",
        description: stats.join(' • '),
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-pages"] });
      
      if (isComplete) {
        setTimeout(() => {
          onOpenChange(false);
          resetState();
        }, 3000);
      }
    } catch (error) {
      console.error("Erro ao continuar importação:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao continuar importação",
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Sitemap</DialogTitle>
          <DialogDescription>
            Importe automaticamente todas as URLs do sitemap do site
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sitemap_url">URL do Sitemap</Label>
            <Input
              id="sitemap_url"
              type="url"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              placeholder="https://seusite.com/sitemap.xml"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Geralmente: https://seusite.com/sitemap.xml ou sitemap_index.xml
            </p>
          </div>

          {totalSitemapsFound > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-semibold text-blue-900">
                Processando sitemaps {currentOffset + 1}-{Math.min(currentOffset + sitemapsPerBatch, totalSitemapsFound)} de {totalSitemapsFound}
              </p>
              <Progress 
                value={(currentOffset / totalSitemapsFound) * 100} 
                className="mt-2"
              />
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Importando URLs do sitemap...
              </p>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-3">
              <div className="flex items-center gap-2 text-success font-semibold">
                <FileText className="w-4 h-4" />
                {(currentOffset + result.sitemapsProcessed) >= result.totalSitemapsFound 
                  ? "✅ Importação 100% Completa!" 
                  : "Lote Processado"}
              </div>
              <div className="text-sm space-y-1">
                <p className="font-semibold">📊 Progresso do Sitemap:</p>
                <p>• {result.sitemapsProcessed} de {result.totalSitemapsFound} sitemaps processados neste lote</p>
                <p>• Total processado: {currentOffset + result.sitemapsProcessed}/{result.totalSitemapsFound} ({Math.round(((currentOffset + result.sitemapsProcessed) / result.totalSitemapsFound) * 100)}%)</p>
                
                <p className="font-semibold mt-2">🔗 URLs Encontradas:</p>
                <p>• {result.totalUrlsFound} URLs encontradas neste lote</p>
                <p>• {result.urlsImported} URLs importadas ({result.newPages} novas + {result.updatedPages} atualizadas)</p>
                
                {result.deactivatedPages > 0 && (
                  <p className="text-warning">⚠️ {result.deactivatedPages} páginas desativadas</p>
                )}
                {result.limited && (
                  <p className="text-warning">⚡ Limite de {result.urlsImported} URLs aplicado</p>
                )}
                {result.errors > 0 && (
                  <p className="text-destructive">⚠️ {result.errors} erros encontrados</p>
                )}
              </div>
            </div>
          )}

          {!result && (
            <div className="space-y-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Importando..." : "Importar Sitemap"}
              </Button>
              
              <Button 
                type="button"
                onClick={handleFullReimport}
                disabled={loading || !sitemapUrl}
                variant="outline"
                className="w-full"
              >
                🔄 Reimportar Tudo (Atualizar + Desativar Antigas)
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Use "Reimportar Tudo" para processar 100% do sitemap e desativar páginas removidas
              </p>
            </div>
          )}

          {result && result.sitemapsProcessed < result.totalSitemapsFound && (
            <Button 
              onClick={handleContinueImport} 
              disabled={loading}
              className="w-full"
            >
              Continuar Importação ({result.totalSitemapsFound - (currentOffset + result.sitemapsProcessed)} sitemaps restantes)
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
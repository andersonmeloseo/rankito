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
import { FileText } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress(10);
    setResult(null);

    try {
      setProgress(30);

      const { data, error } = await supabase.functions.invoke("import-sitemap", {
        body: {
          site_id: siteId,
          sitemap_url: sitemapUrl,
        },
      });

      setProgress(90);

      if (error) throw error;

      setResult(data);
      setProgress(100);

      toast({
        title: "Sitemap importado!",
        description: data.limited 
          ? `${data.newPages} novas páginas, ${data.updatedPages} atualizadas (limite de ${data.totalUrls} aplicado)`
          : `${data.newPages} novas páginas, ${data.updatedPages} atualizadas`,
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-pages"] });
      
      setTimeout(() => {
        onOpenChange(false);
        setSitemapUrl("");
        setProgress(0);
        setResult(null);
      }, 3000);
    } catch (error) {
      console.error("Erro ao importar sitemap:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível importar o sitemap",
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

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Importando URLs do sitemap...
              </p>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-2">
              <div className="flex items-center gap-2 text-success font-semibold">
                <FileText className="w-4 h-4" />
                Importação concluída!
              </div>
              <div className="text-sm space-y-1">
                <p>✅ {result.newPages} páginas novas</p>
                <p>🔄 {result.updatedPages} páginas atualizadas</p>
                <p>📊 {result.totalUrls} URLs processadas{result.limited && ` (limite de 5.000)`}</p>
                {result.errors > 0 && (
                  <p className="text-destructive">⚠️ {result.errors} erros</p>
                )}
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Importando..." : "Importar Sitemap"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
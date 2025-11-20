import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Copy, RefreshCw, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface IndexNowManagerProps {
  siteId: string;
  siteUrl: string;
}

export const IndexNowManager = ({ siteId, siteUrl }: IndexNowManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [urls, setUrls] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Buscar chave IndexNow do site
  const { data: site, isLoading: loadingSite } = useQuery({
    queryKey: ['site-indexnow-key', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_sites')
        .select('indexnow_key')
        .eq('id', siteId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Validar chave IndexNow
  const validateKey = async () => {
    if (!site?.indexnow_key) return;
    
    setIsValidating(true);
    setValidationResult(null);

    try {
      const domain = new URL(siteUrl).hostname;
      const keyFileUrl = `https://${domain}/${site.indexnow_key}.txt`;
      
      const response = await fetch(keyFileUrl);
      const content = await response.text();
      
      if (response.ok && content.trim() === site.indexnow_key) {
        setValidationResult({
          valid: true,
          message: "Chave IndexNow válida! Arquivo verificado com sucesso."
        });
      } else {
        setValidationResult({
          valid: false,
          message: `Arquivo não encontrado ou conteúdo incorreto em ${keyFileUrl}`
        });
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        message: "Erro ao validar chave. Verifique se o arquivo .txt existe no domínio."
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Regenerar chave
  const regenerateKey = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('indexnow-regenerate-key', {
        body: { siteId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['site-indexnow-key', siteId] });
      toast({
        title: "Chave regenerada",
        description: `Nova chave: ${data.key}`,
      });
      setValidationResult(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao regenerar chave",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Enviar URLs para IndexNow
  const submitUrls = useMutation({
    mutationFn: async (urlList: string[]) => {
      const { data, error } = await supabase.functions.invoke('indexnow-submit', {
        body: {
          urls: urlList,
          siteId,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "URLs enviadas",
        description: `${data.urlsCount} URLs enviadas ao IndexNow com sucesso`,
      });
      setUrls("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar URLs",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urlList.length === 0) {
      toast({
        title: "Nenhuma URL",
        description: "Digite ao menos uma URL para enviar",
        variant: "destructive",
      });
      return;
    }

    submitUrls.mutate(urlList);
  };

  const copyKey = () => {
    if (site?.indexnow_key) {
      navigator.clipboard.writeText(site.indexnow_key);
      toast({
        title: "Chave copiada",
        description: "Chave IndexNow copiada para área de transferência",
      });
    }
  };

  if (loadingSite) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Configuração da Chave */}
      <Card>
        <CardHeader>
          <CardTitle>Chave IndexNow</CardTitle>
          <CardDescription>
            Configure e valide sua chave IndexNow para indexação rápida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chave Atual</Label>
            <div className="flex gap-2">
              <Input
                value={site?.indexnow_key || "Nenhuma chave configurada"}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyKey}
                disabled={!site?.indexnow_key}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => regenerateKey.mutate()}
                disabled={regenerateKey.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${regenerateKey.isPending ? 'animate-spin' : ''}`} />
                Regenerar
              </Button>
            </div>
          </div>

          {site?.indexnow_key && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Crie um arquivo <code className="font-mono bg-muted px-1 py-0.5 rounded">{site.indexnow_key}.txt</code> na raiz do seu domínio contendo apenas a chave acima.
                </AlertDescription>
              </Alert>

              <Button
                onClick={validateKey}
                disabled={isValidating}
                variant="secondary"
                className="w-full"
              >
                <CheckCircle2 className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                Validar Chave
              </Button>

              {validationResult && (
                <Alert variant={validationResult.valid ? "default" : "destructive"}>
                  {validationResult.valid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{validationResult.message}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Envio de URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar URLs para IndexNow</CardTitle>
          <CardDescription>
            Envie URLs individuais para indexação via IndexNow API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URLs (uma por linha)</Label>
            <Textarea
              placeholder="https://exemplo.com/pagina1&#10;https://exemplo.com/pagina2"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={8}
              disabled={!site?.indexnow_key || !validationResult?.valid}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!site?.indexnow_key || !validationResult?.valid || submitUrls.isPending}
            className="w-full"
          >
            <Send className={`h-4 w-4 mr-2 ${submitUrls.isPending ? 'animate-spin' : ''}`} />
            Enviar para IndexNow
          </Button>

          {(!site?.indexnow_key || !validationResult?.valid) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure e valide a chave IndexNow antes de enviar URLs
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

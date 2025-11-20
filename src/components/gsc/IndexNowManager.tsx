import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Copy, RefreshCw, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IndexNowHistory } from "./IndexNowHistory";
import { IndexNowDiscoveredUrls } from "./IndexNowDiscoveredUrls";

interface IndexNowManagerProps {
  siteId: string;
  siteUrl: string;
}

export const IndexNowManager = ({ siteId, siteUrl }: IndexNowManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      const { data, error } = await supabase.functions.invoke('indexnow-validate-key', {
        body: { siteId }
      });
      
      if (error) throw error;
      
      if (data.success) {
        setValidationResult({
          valid: true,
          message: data.message || "Chave IndexNow válida! Arquivo verificado com sucesso."
        });
      } else {
        setValidationResult({
          valid: false,
          message: data.error || "Erro ao validar chave"
        });
      }
    } catch (error: any) {
      setValidationResult({
        valid: false,
        message: error.message || "Erro ao validar chave. Verifique se o arquivo .txt existe no domínio."
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Abrir arquivo IndexNow no navegador
  const openKeyFile = () => {
    if (!site?.indexnow_key) return;
    
    const domain = new URL(siteUrl).hostname;
    const keyFileUrl = `https://${domain}/${site.indexnow_key}.txt`;
    window.open(keyFileUrl, '_blank');
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

              <div className="flex gap-2">
                <Button
                  onClick={validateKey}
                  disabled={isValidating}
                  variant="secondary"
                  className="flex-1"
                >
                  <CheckCircle2 className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                  Validar Chave
                </Button>
                
                <Button
                  onClick={openKeyFile}
                  variant="outline"
                  className="flex-1"
                  disabled={!site?.indexnow_key}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Arquivo
                </Button>
              </div>

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

      {/* URLs Descobertas Disponíveis */}
      <IndexNowDiscoveredUrls siteId={siteId} />

      {/* Histórico de Envios */}
      <IndexNowHistory siteId={siteId} />
    </div>
  );
};

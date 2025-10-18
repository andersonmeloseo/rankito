import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, Check, FileCode, AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface PluginDownloadCardProps {
  onOpenGuide: () => void;
  siteId?: string;
  trackingToken?: string;
  trackingPixelInstalled?: boolean;
  siteName?: string;
}

export function PluginDownloadCard({ onOpenGuide, siteId, trackingToken, trackingPixelInstalled, siteName }: PluginDownloadCardProps) {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const trackingUrl = trackingToken 
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion?token=${trackingToken}`
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion`;

  const handleTestConnection = async () => {
    if (!trackingToken || !siteName) {
      toast({
        title: "Erro",
        description: "Token de rastreamento ou nome do site não encontrado",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(trackingUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site_name: siteName,
          page_url: window.location.origin,
          event_type: "test",
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao testar conexão");
      }

      toast({
        title: "Conexão bem-sucedida!",
        description: "O plugin está configurado corretamente.",
      });
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast({
        title: "Erro na conexão",
        description: "Verifique se o plugin está instalado e configurado corretamente no WordPress.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDownload = () => {
    // Trigger download of the plugin file
    const link = document.createElement('a');
    link.href = '/rank-rent-tracker.zip.txt';
    link.download = 'rank-rent-tracker.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download iniciado!",
      description: "Siga o guia de instalação para configurar o plugin.",
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast({
      title: "URL copiada!",
      description: "Cole esta URL nas configurações do plugin.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="w-5 h-5" />
          Plugin WordPress
        </CardTitle>
        <CardDescription>
          Baixe e instale o plugin para rastrear conversões automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status Card */}
        <Card className={trackingPixelInstalled ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {trackingPixelInstalled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-600">Conectado</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-600">Aguardando Conexão</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {trackingPixelInstalled 
                ? "O plugin WordPress está instalado e funcionando corretamente." 
                : "Instale o plugin no WordPress e configure a URL de rastreamento."}
            </p>
            <Button
              onClick={handleTestConnection}
              disabled={!trackingToken || testing}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </CardContent>
        </Card>

        {/* Warning if no token */}
        {!trackingToken && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure o site primeiro para obter a URL de rastreamento única!
            </AlertDescription>
          </Alert>
        )}

        {/* Download Button */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="w-5 h-5" />
            Baixar Plugin (.txt)
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Arquivo de texto com código completo do plugin
          </p>
        </div>

        {/* Tracking URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            URL de Rastreamento {trackingToken && <span className="text-success">(Única para este site)</span>}:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted/50 font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={!trackingToken}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {trackingToken 
              ? "Esta URL é única e segura para este site específico"
              : "Selecione um site primeiro para obter a URL única"}
          </p>
        </div>

        {/* Installation Guide Button */}
        <Button
          variant="outline"
          onClick={onOpenGuide}
          className="w-full gap-2"
        >
          📖 Ver Guia de Instalação Completo
        </Button>

        {/* Quick Tips */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">💡 Dicas Rápidas:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• O plugin rastreia automaticamente cliques e pageviews</li>
            <li>• Configure o nome do site no admin do WordPress</li>
            <li>• Teste a conexão após instalar</li>
            <li>• Verifique os dados na aba "Analytics Avançado"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

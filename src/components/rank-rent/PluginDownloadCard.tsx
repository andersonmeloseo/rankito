import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, FileCode, AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useTestPluginConnection } from "@/hooks/useTestPluginConnection";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PluginDownloadCardProps {
  onOpenGuide: () => void;
  siteId?: string;
  trackingToken?: string;
  trackingPixelInstalled?: boolean;
  siteName?: string;
}

export function PluginDownloadCard({ onOpenGuide, siteId, trackingToken, trackingPixelInstalled, siteName }: PluginDownloadCardProps) {
  const [copied, setCopied] = useState(false);
  const { testConnection, isTestingConnection } = useTestPluginConnection();
  
  const trackingUrl = trackingToken 
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion?token=${trackingToken}`
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast({
      title: "URL copiada!",
      description: "Cole esta URL nas configurações do plugin.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!siteId || !siteName) {
      toast({
        title: "Erro",
        description: "Informações do site não disponíveis",
        variant: "destructive",
      });
      return;
    }
    await testConnection(siteId, siteName);
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
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              </div>
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !siteId}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {trackingPixelInstalled 
                ? "Plugin instalado com sucesso! Os dados estão sendo rastreados automaticamente." 
                : "Configure a URL de rastreamento abaixo no seu plugin WordPress para ativar o rastreamento."}
            </p>
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

        {/* Tracking URL */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">
              URL de Rastreamento {trackingToken && <span className="text-green-600">(Única para este site)</span>}
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              {trackingToken 
                ? "Cole esta URL nas configurações do plugin WordPress" 
                : "Selecione um site primeiro para obter a URL única"}
            </p>
          </div>
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
        </div>

        {/* Installation Guide and Test Connection Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onOpenGuide}
            className="gap-2"
          >
            📖 Guia de Instalação
          </Button>
          <Button
            onClick={handleTestConnection}
            disabled={isTestingConnection || !siteId}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
            {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
          </Button>
        </div>

        {/* Quick Tips */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">💡 Dicas Importantes:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• O plugin rastreia automaticamente cliques e pageviews</li>
            <li>• Configure o nome do site no admin do WordPress</li>
            <li>• O status de conexão é atualizado automaticamente quando o plugin envia dados</li>
            <li>• Verifique os dados na aba "Analytics Avançado"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

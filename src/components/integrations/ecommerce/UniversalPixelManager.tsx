import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileCode, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useTestPluginConnection } from "@/hooks/useTestPluginConnection";

interface UniversalPixelManagerProps {
  trackingToken: string;
  siteName: string;
  pixelInstalled: boolean;
  siteId: string;
}

export const UniversalPixelManager = ({
  trackingToken,
  siteName,
  pixelInstalled,
  siteId
}: UniversalPixelManagerProps) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const { testConnection, isTestingConnection } = useTestPluginConnection();

  const pixelCode = `<!-- Rankito Universal Tracking Pixel -->
<script>
  (function() {
    window.RankitoConfig = {
      token: '${trackingToken}',
      apiEndpoint: '${import.meta.env.VITE_APP_URL}/functions/v1/api-track',
      trackPageViews: true,
      trackClicks: true,
      trackEcommerce: true
    };
    
    var script = document.createElement('script');
    script.src = '${import.meta.env.VITE_APP_URL}/tracking/rankito-pixel.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<!-- End Rankito Pixel -->`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pixelCode);
    toast.success("Código do pixel copiado!");
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(trackingToken);
    setCopiedToken(true);
    toast.success("Token copiado!");
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleDownloadPixel = () => {
    const blob = new Blob([pixelCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rankito-pixel-${siteName.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Código do pixel baixado!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Pixel Universal Rankito</CardTitle>
              <CardDescription>
                Rastreamento automático para qualquer plataforma
              </CardDescription>
            </div>
          </div>
          {pixelInstalled ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Instalado
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Não instalado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Token de Rastreamento</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingToken}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-muted rounded-md font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToken}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copiedToken ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use este token para configurar o pixel em qualquer plataforma
          </p>
        </div>

        {/* Pixel Code Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Código do Pixel</label>
          <div className="relative">
            <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto max-h-64">
              <code>{pixelCode}</code>
            </pre>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="gap-2 flex-1"
            >
              <Copy className="h-4 w-4" />
              Copiar Código
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPixel}
              className="gap-2 flex-1"
            >
              <Download className="h-4 w-4" />
              Baixar Arquivo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testConnection(siteId, siteName)}
              disabled={isTestingConnection}
              className="gap-2 flex-1"
            >
              <Activity className="h-4 w-4" />
              {isTestingConnection ? "Testando..." : "Testar Conexão"}
            </Button>
          </div>
        </div>

        {/* Platforms Info */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <h4 className="text-sm font-medium">Plataformas Suportadas</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>WordPress / WooCommerce</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Shopify</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>HTML / Sites Estáticos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Qualquer CMS</span>
            </div>
          </div>
        </div>

        {/* Features Info */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recursos de Rastreamento</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Visualizações de página automáticas</li>
            <li>Cliques em botões e CTAs</li>
            <li>Eventos de e-commerce (produtos, carrinho, compras)</li>
            <li>Detecção automática de plataforma</li>
            <li>Rastreamento de receita por produto</li>
            <li>Geolocalização e dispositivo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
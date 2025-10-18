import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, Check, FileCode } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface PluginDownloadCardProps {
  onOpenGuide: () => void;
}

export function PluginDownloadCard({ onOpenGuide }: PluginDownloadCardProps) {
  const [copied, setCopied] = useState(false);
  
  const trackingUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion`;

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
          <label className="text-sm font-medium">URL de Rastreamento:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted/50"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use esta URL na configuração do plugin WordPress
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

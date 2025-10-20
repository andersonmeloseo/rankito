import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chrome, Download, Copy, Check, ExternalLink, TrendingUp, Upload } from 'lucide-react';
import { useExternalSources } from '@/hooks/useExternalSources';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ChromeExtensionSetupProps {
  userId: string;
}

export const ChromeExtensionSetup = ({ userId }: ChromeExtensionSetupProps) => {
  const { sources } = useExternalSources(userId);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Find Chrome Extension source
  const extensionSource = sources?.find(s => s.source_type === 'chrome_extension');

  const copyToken = async () => {
    if (!extensionSource) return;
    
    await navigator.clipboard.writeText(extensionSource.api_token);
    setCopiedToken(true);
    toast.success('Token copiado!', {
      description: 'Cole na página de configuração da extensão.',
    });
    
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const openSetupPage = () => {
    window.open('/extension-setup', '_blank');
  };

  const handleUploadExtension = async () => {
    setIsUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke('upload-chrome-extension');
      
      if (error) throw error;
      
      toast.success('Extensão carregada com sucesso!');
      console.log('URL da extensão:', data.url);
    } catch (error) {
      console.error('Erro ao carregar extensão:', error);
      toast.error('Erro ao carregar extensão');
    } finally {
      setIsUploading(false);
    }
  };

  if (!extensionSource) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Chrome className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Extensão Chrome - WhatsApp Web</CardTitle>
              <CardDescription>
                Capture leads diretamente do WhatsApp Web
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Chrome className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              Crie uma integração do tipo "Extensão Chrome" para começar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Chrome className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Extensão Chrome - WhatsApp Web</CardTitle>
              <CardDescription>
                {extensionSource.source_name}
              </CardDescription>
            </div>
          </div>
          <Badge variant={extensionSource.is_active ? "default" : "secondary"}>
            {extensionSource.is_active ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-2xl font-bold">
              {extensionSource.stats?.total_leads || 0}
            </div>
            <p className="text-xs text-muted-foreground">Leads Capturados</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {extensionSource.is_active ? '🟢' : '🔴'}
            </div>
            <p className="text-xs text-muted-foreground">Status</p>
          </div>
          <div>
            <div className="text-sm font-medium">
              {extensionSource.stats?.last_lead_at 
                ? new Date(extensionSource.stats.last_lead_at).toLocaleDateString('pt-BR')
                : 'Nenhum'
              }
            </div>
            <p className="text-xs text-muted-foreground">Último Lead</p>
          </div>
        </div>

        {/* Installation Steps */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Como instalar:</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2">Baixe a extensão</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a 
                      href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/extensions/rankito-whatsapp-extension.zip`}
                      download
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar ZIP
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUploadExtension}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Gerando...' : 'Atualizar'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2">Descompacte o arquivo</p>
                <p className="text-muted-foreground text-xs">
                  Extraia o conteúdo do .zip para uma pasta no seu computador
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2">Abra o Chrome</p>
                <p className="text-muted-foreground text-xs mb-2">
                  Acesse: <code className="bg-muted px-1 rounded">chrome://extensions/</code>
                </p>
                <Button variant="ghost" size="sm" onClick={() => {
                  window.open('chrome://extensions/', '_blank');
                }}>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Abrir página de extensões
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2">Ative o "Modo do desenvolvedor"</p>
                <p className="text-muted-foreground text-xs">
                  No canto superior direito da página de extensões
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                5
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2">Carregue a extensão</p>
                <p className="text-muted-foreground text-xs">
                  Clique em "Carregar sem compactação" e selecione a pasta descompactada
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                6
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2">Configure o token</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 text-xs bg-muted rounded-md font-mono truncate">
                      {extensionSource.api_token}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToken}
                    >
                      {copiedToken ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={openSetupPage}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Página de Configuração
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    A página de configuração abrirá automaticamente após a instalação
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> Após configurar, acesse o WhatsApp Web e você verá uma sidebar à direita com as informações do CRM!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, FileText, Zap, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InstantIndexDialog } from './InstantIndexDialog';

interface GSCIndexingControlsProps {
  siteId: string;
  integrationId?: string;
}

export const GSCIndexingControls = ({ siteId, integrationId }: GSCIndexingControlsProps) => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isProcessingSitemap, setIsProcessingSitemap] = useState(false);
  const [instantIndexDialogOpen, setInstantIndexDialogOpen] = useState(false);

  const handleDiscoverPages = async () => {
    if (!integrationId) {
      toast.error('Selecione uma integração GSC primeiro');
      return;
    }

    setIsDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('gsc-pages-discovery', {
        body: {
          site_id: siteId,
          integration_id: integrationId,
          months: 3,
        },
      });

      if (error) throw error;

      toast.success(`✅ ${data.pages_discovered || 0} páginas descobertas e indexadas!`);
    } catch (error: any) {
      toast.error(`Erro ao descobrir páginas: ${error.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleProcessSitemap = async () => {
    if (!integrationId) {
      toast.error('Selecione uma integração GSC primeiro');
      return;
    }

    setIsProcessingSitemap(true);
    try {
      const { data, error } = await supabase.functions.invoke('gsc-sitemaps-process', {
        body: {
          site_id: siteId,
          integration_id: integrationId,
        },
      });

      if (error) throw error;

      // Verificar se há sitemaps que falharam
      if (data.failed_sitemaps && data.failed_sitemaps.length > 0) {
        toast.warning(
          `${data.urls_inserted} URLs descobertas de ${data.sitemaps_processed} sitemap(s). ⚠️ ${data.failed_sitemaps.length} sitemap(s) falharam (404 - não encontrados).`,
          { duration: 7000 }
        );
      } else {
        toast.success(
          `✅ ${data.urls_inserted} URLs descobertas de ${data.sitemaps_processed} sitemap(s) processado(s) com sucesso!`
        );
      }
    } catch (error: any) {
      toast.error(`Erro ao processar sitemap: ${error.message}`);
    } finally {
      setIsProcessingSitemap(false);
    }
  };

  const handleInstantIndex = () => {
    if (!integrationId) {
      toast.error('Selecione uma integração GSC primeiro');
      return;
    }
    setInstantIndexDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Controles de Indexação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleDiscoverPages}
            disabled={isDiscovering || !integrationId}
            className="h-auto flex-col items-start p-4 space-y-2"
            variant="outline"
          >
            <div className="flex items-center gap-2 w-full">
              {isDiscovering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span className="font-semibold">Passo 1 - Descobrir Páginas</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              Busca páginas via Search Analytics API (últimos 3 meses)
            </p>
          </Button>

          <Button
            onClick={handleProcessSitemap}
            disabled={isProcessingSitemap || !integrationId}
            className="h-auto flex-col items-start p-4 space-y-2"
            variant="outline"
          >
            <div className="flex items-center gap-2 w-full">
              {isProcessingSitemap ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              <span className="font-semibold">Passo 2 - Processar Sitemap</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              Extrai URLs do sitemap e envia para indexação
            </p>
          </Button>

          <Button
            onClick={handleInstantIndex}
            disabled={!integrationId}
            className="h-auto flex-col items-start p-4 space-y-2"
            variant="outline"
          >
            <div className="flex items-center gap-2 w-full">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">Passo 3 - Indexação das URLs</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              Envia URLs para indexação (200 URLs/dia por conexão GSC)
            </p>
          </Button>
        </div>

        {!integrationId && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Configure uma integração GSC para usar os controles de indexação
          </p>
        )}
      </CardContent>

      {/* Instant Index Dialog */}
      {integrationId && (
        <InstantIndexDialog
          open={instantIndexDialogOpen}
          onOpenChange={setInstantIndexDialogOpen}
          siteId={siteId}
          integrationId={integrationId}
        />
      )}
    </Card>
  );
};

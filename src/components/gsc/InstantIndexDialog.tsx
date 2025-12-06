import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGSCDiscoveredUrls } from '@/hooks/useGSCDiscoveredUrls';
import { useGSCQuotaStatus } from '@/hooks/useGSCQuotaStatus';

interface InstantIndexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  integrationId: string;
}

export const InstantIndexDialog = ({ open, onOpenChange, siteId, integrationId }: InstantIndexDialogProps) => {
  const { urls: allUrls, isLoading } = useGSCDiscoveredUrls(siteId);
  
  // Filter locally for discovered URLs only
  const urls = allUrls?.filter(u => u.current_status === 'discovered') || [];

  const { quotaStatus } = useGSCQuotaStatus(siteId);

  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const quotaRemaining = quotaStatus?.total_remaining ?? null;
  const quotaTotal = quotaStatus?.total_limit ?? 200;

  const handleSelectAll = () => {
    if (selectedUrls.length === urls?.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(urls?.map(u => u.url) || []);
    }
  };

  const handleToggleUrl = (url: string) => {
    setSelectedUrls(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleSubmit = async () => {
    if (selectedUrls.length === 0) {
      toast.error('Selecione ao menos uma URL');
      return;
    }

    if (quotaRemaining !== null && selectedUrls.length > quotaRemaining) {
      toast.error(`Você só pode indexar ${quotaRemaining} URLs hoje (quota diária agregada: ${quotaTotal})`);
      return;
    }

    setIsIndexing(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('gsc-instant-index', {
        body: {
          site_id: siteId,
          integration_id: integrationId,
          urls: selectedUrls,
        },
      });

      if (error) throw error;

      setProgress(100);
      toast.success(`${data.urls_successful || 0} URLs indexadas com sucesso!`);
      
      // Close dialog and reset
      setTimeout(() => {
        onOpenChange(false);
        setSelectedUrls([]);
        setProgress(0);
      }, 1500);
    } catch (error: any) {
      toast.error(`Erro ao indexar URLs: ${error.message}`);
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Indexação Instantânea
          </DialogTitle>
          <DialogDescription>
            Selecione as URLs que deseja enviar para indexação no Google Search Console
          </DialogDescription>
        </DialogHeader>

        {/* Quota Alert */}
        {quotaRemaining !== null && (
          <Alert variant={quotaRemaining > 50 ? 'default' : 'destructive'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Quota disponível hoje: <strong>{quotaRemaining} / {quotaTotal} URLs</strong>
              {quotaStatus && quotaStatus.integrations_count > 1 && (
                <span className="text-xs ml-2 opacity-75">
                  ({quotaStatus.integrations_count} conexões ativas)
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Count */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedUrls.length} URL{selectedUrls.length !== 1 ? 's' : ''} selecionada{selectedUrls.length !== 1 ? 's' : ''}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            {selectedUrls.length === urls?.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </Button>
        </div>

        {/* URLs List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando URLs...</p>
          ) : urls && urls.length > 0 ? (
            urls.map((urlData) => (
              <div key={urlData.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={selectedUrls.includes(urlData.url)}
                  onCheckedChange={() => handleToggleUrl(urlData.url)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{urlData.url}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {urlData.impressions || 0} impressões
                    </Badge>
                    {urlData.position && (
                      <Badge variant="outline" className="text-xs">
                        Pos: {urlData.position.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-muted-foreground">Todas as URLs já estão indexadas!</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isIndexing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">
              Indexando URLs... {progress}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isIndexing}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isIndexing || selectedUrls.length === 0}>
            <Zap className="h-4 w-4 mr-2" />
            Indexar {selectedUrls.length > 0 && `(${selectedUrls.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

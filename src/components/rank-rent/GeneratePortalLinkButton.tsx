import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, Plus, RefreshCw, Power, PowerOff } from 'lucide-react';
import { usePortalToken } from '@/hooks/usePortalToken';
import { useToast } from '@/hooks/use-toast';

interface GeneratePortalLinkButtonProps {
  clientId: string;
  clientName: string;
}

export const GeneratePortalLinkButton = ({ clientId, clientName }: GeneratePortalLinkButtonProps) => {
  const [portal, setPortal] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { 
    loading, 
    generatePortalLink, 
    togglePortalStatus, 
    regenerateToken,
    getPortalByClient 
  } = usePortalToken();
  const { toast } = useToast();

  useEffect(() => {
    loadPortal();
  }, [clientId]);

  const loadPortal = async () => {
    const data = await getPortalByClient(clientId);
    setPortal(data);
  };

  const handleGenerate = async () => {
    const data = await generatePortalLink(clientId);
    setPortal(data);
  };

  const handleCopy = () => {
    if (!portal) return;
    const link = `${import.meta.env.VITE_APP_URL}/client-portal/${portal.portal_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    if (!portal) return;
    window.open(`/client-portal/${portal.portal_token}`, '_blank');
  };

  const handleToggle = async () => {
    if (!portal) return;
    await togglePortalStatus(portal.id, !portal.enabled);
    await loadPortal();
  };

  const handleRegenerate = async () => {
    if (!portal) return;
    const data = await regenerateToken(portal.id);
    setPortal(data);
  };

  const portalLink = portal ? `${import.meta.env.VITE_APP_URL}/client-portal/${portal.portal_token}` : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Portal Analítico do Cliente
        </CardTitle>
        <CardDescription>
          Gere um link personalizado para que {clientName} acesse seu dashboard analítico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {portal ? (
          <>
            <div className="flex gap-2">
              <Input 
                value={portalLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleCopy}
                variant="outline"
                disabled={loading}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handlePreview}
                variant="outline"
                disabled={loading}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRegenerate}
                disabled={loading}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerar Link
              </Button>
              <Button 
                variant={portal.enabled ? "destructive" : "default"}
                onClick={handleToggle}
                disabled={loading}
                className="flex-1"
              >
                {portal.enabled ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Desabilitar
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Habilitar
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Status: <span className={portal.enabled ? "text-green-600" : "text-red-600"}>
                {portal.enabled ? "Ativo" : "Desativado"}
              </span>
            </div>
          </>
        ) : (
          <Button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Gerar Portal Analítico
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

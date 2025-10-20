import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, ExternalLink, Users, BarChart } from "lucide-react";
import { ClientWithPortalStatus } from "@/hooks/useClientIntegration";
import { EndClientAccessSection } from "./EndClientAccessSection";
import { ClientPortalPreview } from "./ClientPortalPreview";
import { toast } from "@/hooks/use-toast";

interface ClientManageAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientWithPortalStatus | null;
  onTogglePortal: (enabled: boolean) => void;
}

export const ClientManageAccessDialog = ({
  open,
  onOpenChange,
  client,
  onTogglePortal,
}: ClientManageAccessDialogProps) => {
  if (!client) return null;

  const portalUrl = client.portal_token
    ? `${window.location.origin}/client-portal/${client.portal_token}`
    : "";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: "Link copiado para área de transferência",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Acesso - {client.client_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="portal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="portal" className="gap-2">
              <BarChart className="w-4 h-4" />
              Portal Analítico
            </TabsTrigger>
            <TabsTrigger value="endclient" className="gap-2">
              <Users className="w-4 h-4" />
              Acesso End Client
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Portal Analítico */}
          <TabsContent value="portal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status do Portal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle para ativar/desativar */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Portal Ativo</p>
                    <p className="text-sm text-muted-foreground">
                      Cliente pode acessar dashboard de analytics completo
                    </p>
                  </div>
                  <Switch
                    checked={client.portal_enabled || false}
                    onCheckedChange={onTogglePortal}
                  />
                </div>

                {/* Link do portal (se ativo) */}
                {client.portal_enabled && portalUrl && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <Label>Link do Portal</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={portalUrl} className="font-mono text-sm" />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(portalUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => window.open(portalUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Compartilhe este link com seu cliente para acesso ao portal
                    </p>
                  </div>
                )}

                {/* Informações de acesso */}
                {client.portal_enabled && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-primary/5 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Conversões (30d)</p>
                      <p className="text-lg font-bold">{client.conversions_30d}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Page Views (30d)</p>
                      <p className="text-lg font-bold">{client.page_views_30d}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sites Ativos</p>
                      <p className="text-lg font-bold">{client.total_sites}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Páginas</p>
                      <p className="text-lg font-bold">{client.total_pages}</p>
                    </div>
                  </div>
                )}

                {!client.portal_enabled && (
                  <div className="p-4 border border-dashed rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Ative o portal para permitir que seu cliente acesse o dashboard de analytics
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview do portal */}
            {client.portal_enabled && client.portal_token && (
              <ClientPortalPreview portalToken={client.portal_token} />
            )}
          </TabsContent>

          {/* Tab 2: End Client Access */}
          <TabsContent value="endclient" className="space-y-4">
            <EndClientAccessSection
              clientId={client.client_id}
              clientName={client.client_name}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

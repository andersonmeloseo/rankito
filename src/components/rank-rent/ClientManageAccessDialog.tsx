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
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Users, BarChart, Globe } from "lucide-react";
import { ClientWithPortalStatus } from "@/hooks/useClientIntegration";
import { EndClientAccessSection } from "./EndClientAccessSection";
import { ClientPortalPreview } from "./ClientPortalPreview";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
    ? `${import.meta.env.VITE_APP_URL}/client-portal/${client.portal_token}`
    : "";

  // Fetch client sites
  const { data: clientSites, isLoading: sitesLoading } = useQuery({
    queryKey: ["client-sites-dialog", client.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_sites")
        .select("id, site_name, site_url, monthly_rent_value")
        .eq("client_id", client.client_id)
        .eq("is_rented", true)
        .order("site_name");
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: "Link copiado para área de transferência",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
          <TabsContent value="portal" className="space-y-6">
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

            {/* Sites Alugados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Sites Alugados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sitesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : clientSites && clientSites.length > 0 ? (
                  <div className="space-y-3">
                    {clientSites.map((site) => (
                      <div key={site.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{site.site_name}</p>
                          <a 
                            href={site.site_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 truncate"
                          >
                            <span className="truncate">{site.site_url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                        <Badge variant="secondary" className="ml-3 flex-shrink-0">
                          R$ {site.monthly_rent_value?.toLocaleString("pt-BR") || "0"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum site alugado
                  </p>
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

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SiteDetailModalProps {
  siteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SiteDetailModal = ({ siteId, open, onOpenChange }: SiteDetailModalProps) => {
  const { data: site } = useQuery({
    queryKey: ["site-detail", siteId],
    queryFn: async () => {
      if (!siteId) return null;
      const { data, error } = await supabase
        .from("rank_rent_sites")
        .select("*")
        .eq("id", siteId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!siteId && open,
  });

  const { data: recentConversions } = useQuery({
    queryKey: ["site-conversions", siteId],
    queryFn: async () => {
      if (!siteId) return [];
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!siteId && open,
  });

  const generatePixelCode = () => {
    if (!site) return "";

    return `<script>
(function() {
  const TRACKING_ENDPOINT = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion';
  const SITE_NAME = '${site.site_name}';

  function trackEvent(eventType, ctaText = null) {
    const data = {
      site_name: SITE_NAME,
      page_url: window.location.href,
      event_type: eventType,
      cta_text: ctaText,
      metadata: {
        referrer: document.referrer,
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        timestamp: new Date().toISOString()
      }
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(TRACKING_ENDPOINT, blob);
    } else {
      fetch(TRACKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(e => console.error('Tracking error:', e));
    }
  }

  // Page View (automático)
  trackEvent('page_view');

  // Rastrear cliques em telefone
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href^="tel:"]');
    if (target) trackEvent('phone_click', target.textContent.trim());
  });

  // Rastrear cliques em email
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href^="mailto:"]');
    if (target) trackEvent('email_click', target.textContent.trim());
  });

  // Rastrear cliques em WhatsApp
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"]');
    if (target) trackEvent('whatsapp_click', target.textContent.trim());
  });

  // Rastrear botões com classe .track-cta
  document.addEventListener('click', function(e) {
    const target = e.target.closest('.track-cta, button[data-track]');
    if (target) trackEvent('button_click', target.textContent.trim());
  });
})();
</script>`;
  };

  const copyPixelCode = () => {
    navigator.clipboard.writeText(generatePixelCode());
    toast({
      title: "Código copiado!",
      description: "Cole o código no <head> do seu site WordPress.",
    });
  };

  if (!site) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {site.site_name}
            <Badge variant={site.is_rented ? "default" : "outline"}>
              {site.is_rented ? "Alugado" : "Disponível"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            <a href={site.site_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
              {site.site_url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="pixel">Código Pixel</TabsTrigger>
            <TabsTrigger value="conversions">Conversões Recentes</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Nicho</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{site.niche}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Localização</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{site.location}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Valor Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-success">
                    R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pixel Instalado</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={site.tracking_pixel_installed ? "default" : "destructive"}>
                    {site.tracking_pixel_installed ? "Sim" : "Não"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {site.client_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Nome:</strong> {site.client_name}</p>
                  {site.client_email && <p><strong>Email:</strong> {site.client_email}</p>}
                  {site.client_phone && <p><strong>Telefone:</strong> {site.client_phone}</p>}
                </CardContent>
              </Card>
            )}

            {site.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{site.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pixel">
            <Card>
              <CardHeader>
                <CardTitle>Código JavaScript para WordPress</CardTitle>
                <CardDescription>
                  Cole este código no <code className="bg-muted px-1 rounded">&lt;head&gt;</code> do seu site WordPress
                  (use o plugin "Insert Headers and Footers" ou edite o tema).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{generatePixelCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 gap-1"
                    onClick={copyPixelCode}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversions">
            <Card>
              <CardHeader>
                <CardTitle>Últimas 10 Conversões</CardTitle>
              </CardHeader>
              <CardContent>
                {!recentConversions || recentConversions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma conversão registrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {recentConversions.map((conv) => (
                      <div key={conv.id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <div>
                          <Badge className="mb-1">{conv.event_type}</Badge>
                          <p className="text-sm font-medium">{conv.page_path}</p>
                          {conv.cta_text && <p className="text-xs text-muted-foreground">"{conv.cta_text}"</p>}
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(conv.created_at).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

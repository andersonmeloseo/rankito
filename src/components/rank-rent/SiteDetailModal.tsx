import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Download, Edit, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { ImportSitemapDialog } from "./ImportSitemapDialog";
import { EditPageDialog } from "./EditPageDialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SiteDetailModalProps {
  siteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SiteDetailModal = ({ siteId, open, onOpenChange }: SiteDetailModalProps) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  const { data: pages, isLoading: loadingPages } = useQuery({
    queryKey: ["site-pages", siteId],
    queryFn: async () => {
      if (!siteId) return [];
      const { data, error } = await supabase
        .from("rank_rent_page_metrics")
        .select("*")
        .eq("site_id", siteId)
        .order("total_page_views", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!siteId && open,
    refetchInterval: 30000,
  });

  const filteredPages = pages?.filter((page) => {
    const search = searchTerm.toLowerCase();
    return (
      page.page_url?.toLowerCase().includes(search) ||
      page.page_title?.toLowerCase().includes(search)
    );
  }) || [];

  const handleEditPage = (page: any) => {
    setSelectedPage(page);
    setShowEditDialog(true);
  };

  const generatePixelCode = () => {
    if (!site) return "";

    return `<script>
(function() {
  const TRACKING_ENDPOINT = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion';
  const SITE_NAME = '${site.site_name}';

  // Detectar telefone na página
  function detectPhoneNumber() {
    const phoneRegex = /(\\(?\\d{2}\\)?\\s?9?\\d{4}[-\\s]?\\d{4}|\\d{11})/g;
    const bodyText = document.body.innerText;
    const matches = bodyText.match(phoneRegex);
    return matches ? matches[0] : null;
  }

  function trackEvent(eventType, ctaText = null, extra = {}) {
    const data = {
      site_name: SITE_NAME,
      page_url: window.location.href,
      event_type: eventType,
      cta_text: ctaText,
      metadata: {
        referrer: document.referrer,
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        timestamp: new Date().toISOString(),
        page_title: document.title,
        detected_phone: detectPhoneNumber(),
        ...extra
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

  // Page View automático com metadata
  trackEvent('page_view');

  // Rastrear TODOS os cliques em elementos clicáveis
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a, button, [role="button"]');
    if (!target) return;
    
    const href = target.getAttribute('href') || '';
    const text = target.textContent.trim();
    
    // Classificar tipo automaticamente
    let eventType = 'button_click';
    if (href.startsWith('tel:')) eventType = 'phone_click';
    else if (href.startsWith('mailto:')) eventType = 'email_click';
    else if (href.includes('wa.me') || href.includes('whatsapp')) eventType = 'whatsapp_click';
    
    trackEvent(eventType, text, {
      href: href,
      element_id: target.id || null,
      element_class: target.className || null
    });
  });

  // Rastrear submit de formulários
  document.addEventListener('submit', function(e) {
    if (e.target.matches('form')) {
      trackEvent('form_submit', 'Form Submission');
    }
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="pixel">Código Pixel</TabsTrigger>
            <TabsTrigger value="pages">Páginas</TabsTrigger>
            <TabsTrigger value="conversions">Conversões</TabsTrigger>
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

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Páginas do Site</CardTitle>
                    <CardDescription>Gerencie todas as páginas e suas métricas</CardDescription>
                  </div>
                  <Button onClick={() => setShowImportDialog(true)} size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Importar Sitemap
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por URL ou título..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredPages.length} página(s)
                  </p>
                </div>

                {loadingPages ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </div>
                ) : filteredPages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchTerm ? "Nenhuma página encontrada" : "Nenhuma página importada ainda. Use o botão 'Importar Sitemap' acima."}
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Página</TableHead>
                          <TableHead className="text-right">Visualizações</TableHead>
                          <TableHead className="text-right">Conversões</TableHead>
                          <TableHead className="text-right">Taxa Conv.</TableHead>
                          <TableHead className="text-right">Valor Mensal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPages.map((page) => (
                          <TableRow key={page.page_id}>
                            <TableCell>
                              <div className="max-w-xs">
                                <a
                                  href={page.page_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium hover:underline truncate block"
                                  title={page.page_url}
                                >
                                  {page.page_title || page.page_path}
                                </a>
                                <p className="text-xs text-muted-foreground truncate" title={page.page_path}>
                                  {page.page_path}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{page.total_page_views || 0}</TableCell>
                            <TableCell className="text-right">{page.total_conversions || 0}</TableCell>
                            <TableCell className="text-right">
                              {page.conversion_rate ? `${Number(page.conversion_rate).toFixed(1)}%` : "0%"}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {Number(page.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={page.is_rented ? "default" : "outline"}>
                                {page.is_rented ? "Alugado" : "Disponível"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {page.client_name ? (
                                <Badge variant="secondary">{page.client_name}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPage(page)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
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

      {siteId && (
        <>
          <ImportSitemapDialog
            siteId={siteId}
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
          />
          {selectedPage && (
            <EditPageDialog
              page={selectedPage}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
            />
          )}
        </>
      )}
    </Dialog>
  );
};

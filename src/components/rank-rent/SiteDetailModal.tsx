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

    // URL hardcoded - não usar variável de ambiente que não existe em sites externos
    const trackingUrl = `https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/track-rank-rent-conversion?token=${site.tracking_token}`;

    return `<script>
(function() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 PIXEL INICIANDO - VERSÃO DEBUG DETALHADO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const TRACKING_ENDPOINT = '${trackingUrl}';
  const SITE_NAME = '${site.site_name}';

  console.log('📍 Configuração do Pixel:');
  console.log('   Endpoint:', TRACKING_ENDPOINT);
  console.log('   Site:', SITE_NAME);
  console.log('   URL Atual:', window.location.href);
  console.log('   Timestamp:', new Date().toISOString());

  function detectPhoneNumber() {
    const phoneRegex = /(\\(?\\d{2}\\)?\\s?9?\\d{4}[-\\s]?\\d{4}|\\d{11})/g;
    const bodyText = document.body.innerText;
    const matches = bodyText.match(phoneRegex);
    const phone = matches ? matches[0] : null;
    console.log('📞 Telefone detectado na página:', phone);
    return phone;
  }

  function trackEvent(eventType, ctaText = null, extra = {}) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 INICIANDO TRACKING');
    console.log('   Tipo de Evento:', eventType);
    console.log('   Texto CTA:', ctaText);
    console.log('   Dados Extra:', extra);
    
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

    console.log('📦 Payload Completo:');
    console.log(JSON.stringify(data, null, 2));
    console.log('🌐 Enviando POST para:', TRACKING_ENDPOINT);
    console.log('⏰ Horário do envio:', new Date().toLocaleString());

    fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
      mode: 'cors',
      credentials: 'omit'
    })
    .then(response => {
      console.log('✅ RESPOSTA RECEBIDA DO SERVIDOR');
      console.log('   Status HTTP:', response.status);
      console.log('   Status Text:', response.statusText);
      console.log('   OK?:', response.ok);
      console.log('   Headers:');
      response.headers.forEach((value, key) => {
        console.log('      ' + key + ':', value);
      });
      
      if (!response.ok) {
        console.error('❌ Resposta não OK! Status:', response.status);
      }
      
      return response.text();
    })
    .then(text => {
      console.log('📄 Body da Resposta (raw):');
      console.log(text);
      
      try {
        const json = JSON.parse(text);
        console.log('✅ JSON Parseado com Sucesso:');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido:', text);
      }
      
      console.log('✅ TRACKING CONCLUÍDO COM SUCESSO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    })
    .catch(error => {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERRO CRÍTICO NO TRACKING');
      console.error('   Tipo de Erro:', error.name);
      console.error('   Mensagem:', error.message);
      console.error('   Stack Trace:');
      console.error(error.stack);
      console.error('   Possíveis causas:');
      console.error('   - Bloqueio CORS');
      console.error('   - Servidor offline');
      console.error('   - Problema de rede');
      console.error('   - Firewall/Segurança bloqueando');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  }

  // Page View automático
  console.log('📊 Registrando PAGE VIEW automático...');
  trackEvent('page_view');

  // Rastrear cliques
  console.log('👂 Instalando listener de CLIQUES...');
  document.addEventListener('click', function(e) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖱️ CLICK DETECTADO!');
    console.log('   Elemento clicado:', e.target);
    console.log('   Tag:', e.target.tagName);
    console.log('   Classes:', e.target.className);
    console.log('   ID:', e.target.id);
    
    const target = e.target.closest('a, button, [role="button"]');
    
    if (!target) {
      console.log('   ⚠️ Não é um elemento rastreável (a, button, [role="button"])');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    
    console.log('   ✅ Elemento rastreável encontrado!');
    console.log('   Target:', target);
    console.log('   Tag do target:', target.tagName);
    
    const href = target.getAttribute('href') || '';
    const text = target.textContent.trim();
    
    console.log('   📍 href:', href);
    console.log('   📍 Texto:', text);
    console.log('   📍 ID:', target.id);
    console.log('   📍 Classes:', target.className);
    
    let eventType = 'button_click';
    
    if (href.startsWith('tel:')) {
      eventType = 'phone_click';
      console.log('   📞 IDENTIFICADO: Clique em TELEFONE');
    } else if (href.startsWith('mailto:')) {
      eventType = 'email_click';
      console.log('   ✉️ IDENTIFICADO: Clique em EMAIL');
    } else if (href.includes('wa.me') || href.includes('whatsapp') || href.includes('api.whatsapp')) {
      eventType = 'whatsapp_click';
      console.log('   💬 IDENTIFICADO: Clique em WHATSAPP');
      console.log('   💬 URL do WhatsApp:', href);
    } else {
      console.log('   🔘 IDENTIFICADO: Clique em BOTÃO genérico');
    }
    
    console.log('   🎯 Tipo de evento final:', eventType);
    
    trackEvent(eventType, text, {
      href: href,
      element_id: target.id || null,
      element_class: target.className || null,
      target_tag: target.tagName
    });
  });

  // Rastrear formulários
  console.log('👂 Instalando listener de FORMULÁRIOS...');
  document.addEventListener('submit', function(e) {
    if (e.target.matches('form')) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 FORMULÁRIO SUBMETIDO!');
      console.log('   Form:', e.target);
      console.log('   Action:', e.target.action);
      console.log('   Method:', e.target.method);
      trackEvent('form_submit', 'Form Submission', {
        form_action: e.target.action || null,
        form_method: e.target.method || null
      });
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ PIXEL TOTALMENTE CARREGADO E PRONTO!');
  console.log('   - Page views serão rastreados automaticamente');
  console.log('   - Cliques em links, botões serão rastreados');
  console.log('   - Cliques em WhatsApp serão identificados');
  console.log('   - Submissões de formulários serão rastreadas');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

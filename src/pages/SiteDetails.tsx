import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ExternalLink, TrendingUp, Eye, MousePointerClick, DollarSign, Target, Calendar, Edit, Copy, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EditPageDialog } from "@/components/rank-rent/EditPageDialog";
import { ImportSitemapDialog } from "@/components/rank-rent/ImportSitemapDialog";

const SiteDetails = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Fetch site details
  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ["site-details", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_metrics")
        .select("*")
        .eq("site_id", siteId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch pages for this site
  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ["site-pages", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_page_metrics")
        .select("*")
        .eq("site_id", siteId)
        .order("total_page_views", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId,
    refetchInterval: 30000,
  });

  // Fetch recent conversions
  const { data: conversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ["site-conversions", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId,
    refetchInterval: 30000,
  });

  const filteredPages = pages?.filter((page) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      page.page_url?.toLowerCase().includes(searchLower) ||
      page.page_title?.toLowerCase().includes(searchLower) ||
      page.client_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleEditPage = (page: any) => {
    setSelectedPage(page);
    setShowEditDialog(true);
  };

  const copyTrackingCode = () => {
    const code = `<script>
(function() {
  var siteId = '${siteId}';
  var apiUrl = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion';
  
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a[href^="tel:"], button[onclick*="tel:"]');
    if (target) {
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          page_url: window.location.href,
          page_path: window.location.pathname,
          event_type: 'phone_click',
          cta_text: target.textContent || target.innerText,
          referrer: document.referrer,
          user_agent: navigator.userAgent
        })
      });
    }
  });
})();
</script>`;
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado!", description: "Cole no seu site antes do </body>" });
  };

  if (siteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Site não encontrado</p>
            <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{site.site_name}</h1>
                  {site.is_rented ? (
                    <Badge className="bg-success text-success-foreground">Alugado</Badge>
                  ) : (
                    <Badge variant="outline">Disponível</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={site.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {new URL(site.site_url).hostname}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{site.niche}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{site.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Páginas Únicas</p>
                  <p className="text-2xl font-bold text-foreground">{site.unique_pages_with_traffic || 0}</p>
                </div>
                <Target className="w-8 h-8 text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                  <p className="text-2xl font-bold text-foreground">{site.total_page_views?.toLocaleString() || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                  <p className="text-2xl font-bold text-foreground">{site.total_conversions || 0}</p>
                </div>
                <MousePointerClick className="w-8 h-8 text-success opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Conv.</p>
                  <p className="text-2xl font-bold text-foreground">{site.conversion_rate || 0}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-warning opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-success opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Última Conv.</p>
                  <p className="text-sm font-medium text-foreground">
                    {site.last_conversion_at
                      ? new Date(site.last_conversion_at).toLocaleDateString("pt-BR")
                      : "Nenhuma"}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="pages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-4xl">
            <TabsTrigger value="pages">Páginas</TabsTrigger>
            <TabsTrigger value="analytics">Análise</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="settings">Pixel</TabsTrigger>
            <TabsTrigger value="conversions">Conversões</TabsTrigger>
          </TabsList>

          {/* Páginas Tab */}
          <TabsContent value="pages">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Páginas do Site</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredPages?.length || 0} página(s) encontrada(s)
                    </p>
                  </div>
                  <Button onClick={() => setShowImportDialog(true)} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Importar Sitemap
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Buscar por URL, título ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {pagesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </div>
                ) : filteredPages && filteredPages.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Página</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                          <TableHead className="text-right">Conversões</TableHead>
                          <TableHead className="text-right">Taxa Conv.</TableHead>
                          <TableHead className="text-right">Valor Mensal</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPages.map((page) => (
                          <TableRow key={page.page_id}>
                            <TableCell>
                              <div className="max-w-xs">
                                <div className="font-medium text-foreground truncate">
                                  {page.page_title || "Sem título"}
                                </div>
                                <a
                                  href={page.page_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  {page.page_path}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-foreground">
                              {page.total_page_views?.toLocaleString() || 0}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-foreground">
                              {page.total_conversions || 0}
                            </TableCell>
                            <TableCell className="text-right text-foreground">
                              {page.conversion_rate || 0}%
                            </TableCell>
                            <TableCell className="text-right font-medium text-success">
                              R${" "}
                              {Number(page.monthly_rent_value || 0).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-center">
                              {page.is_rented ? (
                                <Badge className="bg-success text-success-foreground">Alugada</Badge>
                              ) : (
                                <Badge variant="outline">Disponível</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {page.client_name ? (
                                <span className="text-sm text-foreground">{page.client_name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPage(page)}
                                className="gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {searchTerm ? "Nenhuma página encontrada com esse critério." : "Nenhuma página cadastrada ainda."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise Tab */}
          <TabsContent value="analytics">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Análise e Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Performance Geral</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Total de Visualizações</span>
                        <span className="font-semibold text-foreground">{site.total_page_views?.toLocaleString() || 0}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Total de Conversões</span>
                        <span className="font-semibold text-success">{site.total_conversions || 0}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Taxa de Conversão</span>
                        <span className="font-semibold text-foreground">{site.conversion_rate || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Informações Financeiras</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Valor Mensal Atual</span>
                        <span className="font-semibold text-success">
                          R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Páginas Alugadas</span>
                        <span className="font-semibold text-foreground">
                          {pages?.filter((p) => p.is_rented).length || 0} / {pages?.length || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Valor Médio por Página</span>
                        <span className="font-semibold text-foreground">
                          R${" "}
                          {pages && pages.length > 0
                            ? (Number(site.monthly_rent_value || 0) / pages.length).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })
                            : "0,00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cliente Tab */}
          <TabsContent value="client">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                {site.client_name ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome do Cliente</label>
                      <p className="text-foreground mt-1">{site.client_name}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status do Contrato</label>
                        <div className="mt-1">
                          {site.is_rented ? (
                            <Badge className="bg-success text-success-foreground">Ativo</Badge>
                          ) : (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
                        <p className="text-foreground mt-1 font-semibold">
                          R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum cliente vinculado a este site.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pixel Tab */}
          <TabsContent value="settings">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Código de Tracking (Pixel)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cole este código antes da tag <code className="bg-muted px-2 py-1 rounded">&lt;/body&gt;</code> em todas as
                    páginas do seu site.
                  </p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      <code>{`<script>
(function() {
  var siteId = '${siteId}';
  var apiUrl = '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-rank-rent-conversion';
  
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a[href^="tel:"], button[onclick*="tel:"]');
    if (target) {
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          page_url: window.location.href,
          page_path: window.location.pathname,
          event_type: 'phone_click',
          cta_text: target.textContent || target.innerText,
          referrer: document.referrer,
          user_agent: navigator.userAgent
        })
      });
    }
  });
})();
</script>`}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 gap-2"
                      onClick={copyTrackingCode}
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Status da Instalação</h3>
                  {site.tracking_pixel_installed ? (
                    <Badge className="bg-success text-success-foreground">Instalado</Badge>
                  ) : (
                    <Badge variant="outline">Não instalado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversões Tab */}
          <TabsContent value="conversions">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Conversões Recentes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Últimas 50 conversões registradas</p>
              </CardHeader>
              <CardContent>
                {conversionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </div>
                ) : conversions && conversions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Página</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>CTA</TableHead>
                          <TableHead>IP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversions.map((conversion) => (
                          <TableRow key={conversion.id}>
                            <TableCell className="text-foreground">
                              {new Date(conversion.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <a
                                href={conversion.page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {conversion.page_path}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{conversion.event_type}</Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{conversion.cta_text || "-"}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{conversion.ip_address || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhuma conversão registrada ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {selectedPage && (
        <EditPageDialog page={selectedPage} open={showEditDialog} onOpenChange={setShowEditDialog} />
      )}
      <ImportSitemapDialog siteId={siteId || ""} open={showImportDialog} onOpenChange={setShowImportDialog} />
    </div>
  );
};

export default SiteDetails;

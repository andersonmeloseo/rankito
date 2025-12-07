import { useState } from "react";
import { Plus, Megaphone, Settings2, Trash2, Eye, Target, Calendar, DollarSign, HelpCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCampaignConfigs, useDetectedCampaigns, CampaignConfig, CreateCampaignInput } from "@/hooks/useCampaignConfigs";
import { ConversionGoal } from "@/hooks/useConversionGoals";
import { CampaignEventsDrawer } from "./CampaignEventsDrawer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface CampaignManagerProps {
  siteId: string;
  goals: ConversionGoal[];
}

export const CampaignManager = ({ siteId, goals }: CampaignManagerProps) => {
  const { campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign } = useCampaignConfigs(siteId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignConfig | null>(null);
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCampaignInput>({
    site_id: siteId,
    campaign_name: '',
    utm_campaign_pattern: '',
    utm_source_pattern: '',
    utm_medium_pattern: '',
    goal_id: null,
    budget: 0,
    start_date: null,
    end_date: null,
    is_active: true,
  });

  const configuredPatterns = campaigns
    .filter(c => c.utm_campaign_pattern)
    .map(c => c.utm_campaign_pattern!);

  const { data: detectedCampaigns = [] } = useDetectedCampaigns(siteId, configuredPatterns);

  // Validação: pelo menos 1 critério de filtro
  const hasValidFilter = formData.goal_id || formData.utm_campaign_pattern || formData.utm_source_pattern || formData.utm_medium_pattern;

  const handleCreate = async () => {
    if (!hasValidFilter) {
      toast.warning('Configure pelo menos um critério de filtro (meta ou padrão UTM)');
      return;
    }
    await createCampaign.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      await deleteCampaign.mutateAsync(id);
    }
  };

  const handleConfigureDetected = (utmCampaign: string) => {
    setFormData({
      ...formData,
      campaign_name: utmCampaign,
      utm_campaign_pattern: utmCampaign,
    });
    setIsCreateOpen(true);
  };

  const resetForm = () => {
    setFormData({
      site_id: siteId,
      campaign_name: '',
      utm_campaign_pattern: '',
      utm_source_pattern: '',
      utm_medium_pattern: '',
      goal_id: null,
      budget: 0,
      start_date: null,
      end_date: null,
      is_active: true,
    });
  };

  const openEventsDrawer = (campaign: CampaignConfig) => {
    setSelectedCampaign(campaign);
    setIsEventsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Configured Campaigns */}
      <TooltipProvider>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-primary opacity-80" />
                Campanhas Configuradas
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Configure suas campanhas de ads para rastrear ROI. Vincule a uma meta de conversão E/OU padrões UTM para medir performance específica.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription className="mt-1">
                Rastreie ROI, CPA e performance de cada campanha de ads
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Campanha
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Campanha</DialogTitle>
                  <DialogDescription>
                    Configure critérios para agrupar e analisar eventos de uma campanha específica
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Nome da Campanha *
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Nome para identificar a campanha no dashboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      value={formData.campaign_name}
                      onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                      placeholder="Ex: Black Friday 2024"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Padrão UTM Campaign
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Filtra eventos onde utm_campaign contém este texto</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      value={formData.utm_campaign_pattern || ''}
                      onChange={(e) => setFormData({ ...formData, utm_campaign_pattern: e.target.value })}
                      placeholder="Ex: black_friday"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        UTM Source
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Origem do tráfego (google, facebook, etc)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        value={formData.utm_source_pattern || ''}
                        onChange={(e) => setFormData({ ...formData, utm_source_pattern: e.target.value })}
                        placeholder="google, facebook..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        UTM Medium
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tipo de mídia (cpc, email, social, etc)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        value={formData.utm_medium_pattern || ''}
                        onChange={(e) => setFormData({ ...formData, utm_medium_pattern: e.target.value })}
                        placeholder="cpc, social..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Meta de Conversão Vinculada
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Vincule a uma meta específica para ver apenas conversões dessa meta na campanha</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select
                      value={formData.goal_id || 'none'}
                      onValueChange={(v) => setFormData({ ...formData, goal_id: v === 'none' ? null : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar meta..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma (todas as conversões)</SelectItem>
                        {goals.filter(g => g.is_active).map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.goal_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Orçamento (R$)
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Valor investido para calcular CPA e ROI automaticamente</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                      />
                    </div>
                  </div>

                  {/* Validação visual */}
                  {!hasValidFilter && formData.campaign_name && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Configure pelo menos uma meta OU um padrão UTM
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreate} 
                    disabled={!formData.campaign_name || !hasValidFilter || createCampaign.isPending}
                  >
                    Criar Campanha
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma campanha configurada</p>
              <p className="text-xs mt-1">Crie campanhas para rastrear performance de ads</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Padrão UTM</TableHead>
                  <TableHead>Meta Vinculada</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {campaign.utm_campaign_pattern || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      {campaign.goal ? (
                        <Badge variant="outline" className="gap-1">
                          <Target className="h-3 w-3" />
                          {campaign.goal.goal_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Todas</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.budget > 0 ? (
                        <span className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3" />
                          {campaign.budget.toLocaleString('pt-BR')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {campaign.start_date || campaign.end_date ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {campaign.start_date ? format(new Date(campaign.start_date), 'dd/MM', { locale: ptBR }) : '...'} - 
                          {campaign.end_date ? format(new Date(campaign.end_date), 'dd/MM', { locale: ptBR }) : '...'}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                        {campaign.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEventsDrawer(campaign)}
                          title="Ver Eventos"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(campaign.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detected Campaigns */}
      {detectedCampaigns.length > 0 && (
        <Card className="shadow-card border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-warning opacity-80" />
              Campanhas Detectadas
              <Badge variant="outline" className="ml-2 bg-warning/10">{detectedCampaigns.length}</Badge>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Tráfego identificado automaticamente via utm_campaign que ainda não está vinculado a nenhuma campanha configurada. Configure para rastrear métricas e ROI.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Clique em "Configurar" para criar uma campanha e começar a rastrear ROI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {detectedCampaigns.slice(0, 10).map((detected, index) => (
                <AccordionItem key={detected.utm_campaign} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {detected.utm_campaign}
                      </code>
                      <Badge variant="secondary">{detected.event_count} eventos</Badge>
                      {detected.hasGoogle && (
                        <Badge variant="outline" className="text-xs">Google</Badge>
                      )}
                      {detected.hasMeta && (
                        <Badge variant="outline" className="text-xs">Meta</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-4 space-y-2">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="text-muted-foreground">Sources:</span>
                        {detected.sources.map(s => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      {detected.mediums.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="text-muted-foreground">Mediums:</span>
                          {detected.mediums.map(m => (
                            <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                          ))}
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => handleConfigureDetected(detected.utm_campaign)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Configurar Campanha
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

        {/* Events Drawer */}
        <CampaignEventsDrawer
          siteId={siteId}
          campaign={selectedCampaign}
          open={isEventsOpen}
          onOpenChange={setIsEventsOpen}
        />
      </TooltipProvider>
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMarketingCampaignsV2, CreateCampaignInput } from "@/hooks/useMarketingCampaignsV2";
import { useMarketingStrategies } from "@/hooks/useMarketingStrategies";
import { Plus, Megaphone, DollarSign, TrendingUp, Users, Target, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const CampaignsManager = () => {
  const { 
    campaigns, 
    isLoading, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign,
    totalBudget,
    totalSpent,
    totalLeads,
    totalConversions,
    avgCPA 
  } = useMarketingCampaignsV2();
  const { strategies } = useMarketingStrategies();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignInput>({
    name: "",
    channel: "google_ads",
    strategy_id: "",
    budget_total: 0,
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
  });

  const handleCreate = async () => {
    await createCampaign.mutateAsync({
      ...formData,
      strategy_id: formData.strategy_id || undefined,
    });
    setIsCreateOpen(false);
    setFormData({
      name: "",
      channel: "google_ads",
      strategy_id: "",
      budget_total: 0,
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Pausada</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluída</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Megaphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Campanhas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {totalBudget.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Orçamento Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Gasto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLeads}</p>
                <p className="text-xs text-muted-foreground">Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Target className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {avgCPA.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">CPA Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campanhas Ativas
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Campanha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Campanha</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Campanha</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Google Ads - Dezembro 2025"
                    />
                  </div>

                  <div>
                    <Label>Estratégia (opcional)</Label>
                    <Select 
                      value={formData.strategy_id} 
                      onValueChange={(v) => setFormData({ ...formData, strategy_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma estratégia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {strategies?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Canal</Label>
                    <Select 
                      value={formData.channel} 
                      onValueChange={(v) => setFormData({ ...formData, channel: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_ads">🎯 Google Ads</SelectItem>
                        <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                        <SelectItem value="facebook">👥 Facebook</SelectItem>
                        <SelectItem value="instagram">📸 Instagram</SelectItem>
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="seo">🔍 SEO</SelectItem>
                        <SelectItem value="other">📊 Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Orçamento Total (R$)</Label>
                    <Input
                      type="number"
                      value={formData.budget_total}
                      onChange={(e) => setFormData({ ...formData, budget_total: Number(e.target.value) })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>UTM Source</Label>
                      <Input
                        value={formData.utm_source}
                        onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                        placeholder="google"
                      />
                    </div>
                    <div>
                      <Label>UTM Medium</Label>
                      <Input
                        value={formData.utm_medium}
                        onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                        placeholder="cpc"
                      />
                    </div>
                    <div>
                      <Label>UTM Campaign</Label>
                      <Input
                        value={formData.utm_campaign}
                        onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                        placeholder="lancamento"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreate}>Criar Campanha</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns && campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orçamento</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="capitalize">{campaign.channel.replace("_", " ")}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-right">R$ {campaign.budget_total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">R$ {campaign.budget_spent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{campaign.leads}</TableCell>
                    <TableCell className="text-right">{campaign.conversions}</TableCell>
                    <TableCell className="text-right">
                      R$ {campaign.conversions > 0 ? (campaign.budget_spent / campaign.conversions).toFixed(2) : "0"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={campaign.roi > 0 ? "text-green-600" : "text-red-600"}>
                        {campaign.roi > 0 ? "+" : ""}{campaign.roi.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => deleteCampaign.mutate(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma campanha criada ainda</p>
              <p className="text-sm text-muted-foreground">Crie sua primeira campanha para começar a trackear resultados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

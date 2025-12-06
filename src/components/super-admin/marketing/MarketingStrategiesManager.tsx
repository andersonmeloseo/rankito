import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMarketingStrategies, MarketingStrategy, CreateStrategyInput } from "@/hooks/useMarketingStrategies";
import { Plus, Edit2, Trash2, Play, Pause, CheckCircle, Target } from "lucide-react";

const channels = [
  { value: "google_ads", label: "🎯 Google Ads" },
  { value: "linkedin", label: "💼 LinkedIn" },
  { value: "seo", label: "🔍 SEO + Blog" },
  { value: "referral", label: "🤝 Referral" },
  { value: "partnerships", label: "🤝 Parcerias" },
  { value: "email", label: "📧 Email Marketing" },
  { value: "product", label: "🚀 Product-Led Growth" },
  { value: "instagram", label: "📸 Instagram" },
  { value: "facebook", label: "👥 Facebook Ads" },
  { value: "youtube", label: "▶️ YouTube" },
  { value: "tiktok", label: "🎵 TikTok" },
  { value: "other", label: "📊 Outro" },
];

const types = [
  { value: "paid", label: "💰 Paga" },
  { value: "organic", label: "🌱 Orgânica" },
  { value: "hybrid", label: "🔄 Híbrida" },
  { value: "automation", label: "⚙️ Automação" },
];

const statuses = [
  { value: "planned", label: "📋 Planejada", color: "bg-yellow-100 text-yellow-800" },
  { value: "active", label: "▶️ Em Execução", color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "✅ Concluída", color: "bg-green-100 text-green-800" },
  { value: "paused", label: "⏸️ Pausada", color: "bg-red-100 text-red-800" },
];

export const MarketingStrategiesManager = () => {
  const { strategies, isLoading, createStrategy, updateStrategy, deleteStrategy } = useMarketingStrategies();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<MarketingStrategy | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState<CreateStrategyInput>({
    name: "",
    channel: "google_ads",
    type: "paid",
    budget_monthly: 0,
    target_leads: 0,
    target_conversions: 0,
    status: "planned",
    notes: "",
    priority: 50,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      channel: "google_ads",
      type: "paid",
      budget_monthly: 0,
      target_leads: 0,
      target_conversions: 0,
      status: "planned",
      notes: "",
      priority: 50,
    });
  };

  const handleCreate = async () => {
    await createStrategy.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingStrategy) return;
    await updateStrategy.mutateAsync({ id: editingStrategy.id, ...formData });
    setEditingStrategy(null);
    resetForm();
  };

  const handleStatusChange = async (strategy: MarketingStrategy, newStatus: string) => {
    await updateStrategy.mutateAsync({ id: strategy.id, status: newStatus });
  };

  const filteredStrategies = strategies?.filter(
    (s) => filterStatus === "all" || s.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
    const s = statuses.find((st) => st.value === status);
    return s ? <Badge className={s.color}>{s.label}</Badge> : null;
  };

  const StrategyForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Nome da Estratégia</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Google Ads - Performance"
          />
        </div>

        <div>
          <Label>Canal</Label>
          <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Orçamento Mensal (R$)</Label>
          <Input
            type="number"
            value={formData.budget_monthly}
            onChange={(e) => setFormData({ ...formData, budget_monthly: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label>Meta de Leads</Label>
          <Input
            type="number"
            value={formData.target_leads}
            onChange={(e) => setFormData({ ...formData, target_leads: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label>Meta de Conversões</Label>
          <Input
            type="number"
            value={formData.target_conversions}
            onChange={(e) => setFormData({ ...formData, target_conversions: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label>Prioridade (1-100)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
          />
        </div>

        <div className="col-span-2">
          <Label>Notas / Detalhes</Label>
          <Textarea
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Descreva táticas, KPIs, segmentação..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            setIsCreateOpen(false);
            setEditingStrategy(null);
            resetForm();
          }}
        >
          Cancelar
        </Button>
        <Button onClick={isEdit ? handleUpdate : handleCreate}>
          {isEdit ? "Salvar Alterações" : "Criar Estratégia"}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Estratégias de Marketing
          </h2>
          <p className="text-sm text-muted-foreground">
            {strategies?.length || 0} estratégias configuradas
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Estratégia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Estratégia</DialogTitle>
              </DialogHeader>
              <StrategyForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStrategies?.map((strategy) => (
          <Card key={strategy.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {channels.find((c) => c.value === strategy.channel)?.label.split(" ")[0]}
                  </span>
                  <div>
                    <CardTitle className="text-base line-clamp-1">{strategy.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">
                      {types.find((t) => t.value === strategy.type)?.label}
                    </p>
                  </div>
                </div>
                {getStatusBadge(strategy.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground text-xs">Orçamento/mês</p>
                  <p className="font-semibold">
                    {strategy.budget_monthly > 0 
                      ? `R$ ${strategy.budget_monthly.toLocaleString()}` 
                      : "Orgânico"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Meta Leads</p>
                  <p className="font-semibold">{strategy.target_leads}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Meta Conversões</p>
                  <p className="font-semibold">{strategy.target_conversions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Prioridade</p>
                  <p className="font-semibold">{strategy.priority}</p>
                </div>
              </div>

              {strategy.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {strategy.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {strategy.status === "planned" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600"
                    onClick={() => handleStatusChange(strategy, "active")}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Iniciar
                  </Button>
                )}
                {strategy.status === "active" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-yellow-600"
                      onClick={() => handleStatusChange(strategy, "paused")}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pausar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      onClick={() => handleStatusChange(strategy, "completed")}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Concluir
                    </Button>
                  </>
                )}
                {strategy.status === "paused" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600"
                    onClick={() => handleStatusChange(strategy, "active")}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Retomar
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFormData({
                      name: strategy.name,
                      channel: strategy.channel,
                      type: strategy.type,
                      budget_monthly: strategy.budget_monthly,
                      target_leads: strategy.target_leads,
                      target_conversions: strategy.target_conversions,
                      status: strategy.status,
                      notes: strategy.notes || "",
                      priority: strategy.priority,
                    });
                    setEditingStrategy(strategy);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Estratégia?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A estratégia "{strategy.name}" será removida permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteStrategy.mutate(strategy.id)}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingStrategy} onOpenChange={(open) => !open && setEditingStrategy(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Estratégia</DialogTitle>
          </DialogHeader>
          <StrategyForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
};

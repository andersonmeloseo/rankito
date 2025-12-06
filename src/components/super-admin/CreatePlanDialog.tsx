import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generatePlanDescription } from "@/utils/planDescriptionGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePlanDialog = ({ open, onOpenChange }: CreatePlanDialogProps) => {
  const { createPlan } = useSubscriptionPlans();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    max_sites: "",
    max_pages_per_site: "",
    max_gsc_integrations: "",
    trial_days: "0",
    stripe_checkout_url: "",
    billing_period: "monthly",
    features: [] as string[],
    display_order: 0,
    is_active: true,
    has_advanced_tracking: false,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      name, 
      slug: generateSlug(name) 
    });
  };

  useEffect(() => {
    const autoDescription = generatePlanDescription({
      max_sites: formData.max_sites,
      max_pages_per_site: formData.max_pages_per_site,
      max_gsc_integrations: formData.max_gsc_integrations,
      trial_days: formData.trial_days,
      has_advanced_tracking: formData.has_advanced_tracking,
    });
    
    setFormData(prev => ({ ...prev, description: autoDescription }));
  }, [
    formData.max_sites,
    formData.max_pages_per_site,
    formData.max_gsc_integrations,
    formData.trial_days,
    formData.has_advanced_tracking
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlan({
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      price: Number(formData.price),
      max_sites: formData.max_sites ? Number(formData.max_sites) : null,
      max_pages_per_site: formData.max_pages_per_site ? Number(formData.max_pages_per_site) : null,
      max_gsc_integrations: formData.max_gsc_integrations ? Number(formData.max_gsc_integrations) : null,
      trial_days: Number(formData.trial_days),
      stripe_checkout_url: formData.stripe_checkout_url || null,
      billing_period: formData.billing_period,
      features: formData.features,
      display_order: formData.display_order,
      is_active: formData.is_active,
      has_advanced_tracking: formData.has_advanced_tracking,
    });
    onOpenChange(false);
    // Reset form
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      max_sites: "",
      max_pages_per_site: "",
      max_gsc_integrations: "",
      trial_days: "0",
      stripe_checkout_url: "",
      billing_period: "monthly",
      features: [],
      display_order: 0,
      is_active: true,
      has_advanced_tracking: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Plano</DialogTitle>
          <DialogDescription>
            Configure um novo plano de assinatura
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Plano *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Plano Premium"
              required
              minLength={3}
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="plano-premium"
              required
              pattern="[a-z0-9-]+"
              title="Apenas letras minúsculas, números e hífens"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Gerado automaticamente. Use apenas letras minúsculas, números e hífens.
            </p>
          </div>

          <div>
            <Label htmlFor="description">Descrição (Gerada Automaticamente)</Label>
            <Textarea
              id="description"
              value={formData.description}
              readOnly
              className="bg-muted cursor-not-allowed"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Esta descrição é gerada automaticamente com base nos limites configurados
            </p>
          </div>

          <div>
            <Label htmlFor="price">Preço (R$) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="297.00"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="max_sites">Máx. Sites</Label>
              <Input
                id="max_sites"
                type="number"
                min="1"
                value={formData.max_sites}
                onChange={(e) => setFormData({ ...formData, max_sites: e.target.value })}
                placeholder="Ilimitado"
              />
            </div>

            <div>
              <Label htmlFor="max_pages">Máx. Páginas/Site</Label>
              <Input
                id="max_pages"
                type="number"
                min="1"
                value={formData.max_pages_per_site}
                onChange={(e) => setFormData({ ...formData, max_pages_per_site: e.target.value })}
                placeholder="Ilimitado"
              />
            </div>

            <div>
              <Label htmlFor="max_gsc">Máx. GSC</Label>
              <Input
                id="max_gsc"
                type="number"
                min="0"
                value={formData.max_gsc_integrations}
                onChange={(e) => setFormData({ ...formData, max_gsc_integrations: e.target.value })}
                placeholder="Ilimitado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trial_days">Dias de Trial</Label>
              <Input
                id="trial_days"
                type="number"
                min="0"
                value={formData.trial_days}
                onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = sem trial
              </p>
            </div>

            <div>
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Números menores aparecem primeiro na lista
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="stripe_url">Link de Checkout Stripe</Label>
            <Input
              id="stripe_url"
              type="url"
              value={formData.stripe_checkout_url}
              onChange={(e) => setFormData({ ...formData, stripe_checkout_url: e.target.value })}
              placeholder="https://buy.stripe.com/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link gerado no Stripe para pagamento
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="has_advanced_tracking" className="text-sm font-medium">
                Tracking Avançado
              </Label>
              <p className="text-xs text-muted-foreground">
                Metas de Conversão, Export Google Ads, Meta CAPI
              </p>
            </div>
            <Switch
              id="has_advanced_tracking"
              checked={formData.has_advanced_tracking}
              onCheckedChange={(checked) => setFormData({ ...formData, has_advanced_tracking: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Plano</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

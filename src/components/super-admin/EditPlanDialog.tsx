import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generatePlanDescription } from "@/utils/planDescriptionGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubscriptionPlans, SubscriptionPlan } from "@/hooks/useSubscriptionPlans";

interface EditPlanDialogProps {
  plan: SubscriptionPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPlanDialog = ({ plan, open, onOpenChange }: EditPlanDialogProps) => {
  const { updatePlan } = useSubscriptionPlans();
  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description || "",
    price: plan.price,
    max_sites: plan.max_sites || "",
    max_pages_per_site: plan.max_pages_per_site || "",
    max_gsc_integrations: plan.max_gsc_integrations || "",
    trial_days: plan.trial_days || 0,
    stripe_checkout_url: plan.stripe_checkout_url || "",
  });

  useEffect(() => {
    const autoDescription = generatePlanDescription({
      max_sites: formData.max_sites,
      max_pages_per_site: formData.max_pages_per_site,
      max_gsc_integrations: formData.max_gsc_integrations,
      trial_days: formData.trial_days,
    });
    
    setFormData(prev => ({ ...prev, description: autoDescription }));
  }, [
    formData.max_sites,
    formData.max_pages_per_site,
    formData.max_gsc_integrations,
    formData.trial_days
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlan({
      id: plan.id,
      updates: {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        max_sites: formData.max_sites ? Number(formData.max_sites) : null,
        max_pages_per_site: formData.max_pages_per_site ? Number(formData.max_pages_per_site) : null,
        max_gsc_integrations: formData.max_gsc_integrations ? Number(formData.max_gsc_integrations) : null,
        trial_days: Number(formData.trial_days),
        stripe_checkout_url: formData.stripe_checkout_url || null,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Plano</DialogTitle>
          <DialogDescription>
            Atualize as informações do plano {plan.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Plano</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
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
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_sites">Máx. Sites (vazio = ilimitado)</Label>
              <Input
                id="max_sites"
                type="number"
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
                value={formData.max_pages_per_site}
                onChange={(e) => setFormData({ ...formData, max_pages_per_site: e.target.value })}
                placeholder="Ilimitado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_gsc">Máx. GSC Integrations</Label>
              <Input
                id="max_gsc"
                type="number"
                value={formData.max_gsc_integrations}
                onChange={(e) => setFormData({ ...formData, max_gsc_integrations: e.target.value })}
                placeholder="Ilimitado"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Número de integrações GSC permitidas
              </p>
            </div>

            <div>
              <Label htmlFor="trial_days">Dias de Trial</Label>
              <Input
                id="trial_days"
                type="number"
                min="0"
                value={formData.trial_days}
                onChange={(e) => setFormData({ ...formData, trial_days: Number(e.target.value) })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = sem trial
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

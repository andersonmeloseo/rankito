import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  });

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
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
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

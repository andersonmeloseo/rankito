import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    billing_period: "monthly",
    features: [] as string[],
    display_order: 0,
    is_active: true,
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
      billing_period: formData.billing_period,
      features: formData.features,
      display_order: formData.display_order,
      is_active: formData.is_active,
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
      billing_period: "monthly",
      features: [],
      display_order: 0,
      is_active: true,
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
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do plano"
              rows={2}
            />
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

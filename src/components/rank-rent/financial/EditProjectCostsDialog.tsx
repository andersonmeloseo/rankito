import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useSiteFinancialConfig, SiteFinancialConfig } from "@/hooks/useSiteFinancialConfig";

interface EditProjectCostsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
}

export const EditProjectCostsDialog = ({
  open,
  onOpenChange,
  siteId,
  siteName,
}: EditProjectCostsDialogProps) => {
  const { config, isLoading, saveConfig } = useSiteFinancialConfig(siteId);
  
  const [formData, setFormData] = useState<Omit<SiteFinancialConfig, "id">>({
    site_id: siteId,
    cost_per_conversion: 0,
    monthly_fixed_costs: 0,
    acquisition_cost: 0,
    business_model: "full_site",
    notes: "",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        site_id: config.site_id,
        cost_per_conversion: config.cost_per_conversion,
        monthly_fixed_costs: config.monthly_fixed_costs,
        acquisition_cost: config.acquisition_cost,
        business_model: config.business_model,
        notes: config.notes || "",
      });
    }
  }, [config]);

  const handleSave = async () => {
    await saveConfig.mutateAsync(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Custos do Projeto</DialogTitle>
          <DialogDescription>
            Configure os custos para <strong>{siteName}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cost_per_conversion">Custo por Conversão (R$)</Label>
              <Input
                id="cost_per_conversion"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_per_conversion}
                onChange={(e) =>
                  setFormData({ ...formData, cost_per_conversion: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quanto custa cada lead/conversão gerada
              </p>
            </div>

            <div>
              <Label htmlFor="monthly_fixed_costs">Custos Fixos Mensais (R$)</Label>
              <Input
                id="monthly_fixed_costs"
                type="number"
                min="0"
                step="0.01"
                value={formData.monthly_fixed_costs}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_fixed_costs: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hospedagem, domínio, manutenção, etc.
              </p>
            </div>

            <div>
              <Label htmlFor="acquisition_cost">Custo de Aquisição (R$)</Label>
              <Input
                id="acquisition_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.acquisition_cost}
                onChange={(e) =>
                  setFormData({ ...formData, acquisition_cost: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Investimento inicial para criar/ranquear o site
              </p>
            </div>

            <div>
              <Label htmlFor="business_model">Modelo de Negócio</Label>
              <Select
                value={formData.business_model}
                onValueChange={(value) => setFormData({ ...formData, business_model: value })}
              >
                <SelectTrigger id="business_model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_site">Site Completo</SelectItem>
                  <SelectItem value="per_page">Por Página</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre custos deste projeto..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saveConfig.isPending}>
                {saveConfig.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Custos
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

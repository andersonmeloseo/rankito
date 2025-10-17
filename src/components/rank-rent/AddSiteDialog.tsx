import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const AddSiteDialog = ({ open, onOpenChange, userId }: AddSiteDialogProps) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    site_name: "",
    site_url: "",
    niche: "",
    location: "",
    monthly_rent_value: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("rank_rent_sites").insert({
        user_id: userId,
        site_name: formData.site_name,
        site_url: formData.site_url,
        niche: formData.niche,
        location: formData.location,
        monthly_rent_value: formData.monthly_rent_value ? Number(formData.monthly_rent_value) : 0,
        notes: formData.notes,
      });

      if (error) throw error;

      toast({
        title: "Site cadastrado!",
        description: "O site foi adicionado com sucesso.",
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["rank-rent-sites"] });
      queryClient.invalidateQueries({ queryKey: ["overview-metrics"] });

      // Reset form and close
      setFormData({
        site_name: "",
        site_url: "",
        niche: "",
        location: "",
        monthly_rent_value: "",
        notes: "",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar site",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Site</DialogTitle>
          <DialogDescription>Cadastre um novo site Rank & Rent para começar a rastrear conversões.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">Nome do Site *</Label>
              <Input
                id="site_name"
                placeholder="advogado-curitiba"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Identificador único (sem espaços)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_url">URL do Site *</Label>
              <Input
                id="site_url"
                type="url"
                placeholder="https://advogadocuritiba.com.br"
                value={formData.site_url}
                onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho *</Label>
              <Input
                id="niche"
                placeholder="Advogado, Dentista, Chaveiro..."
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização *</Label>
              <Input
                id="location"
                placeholder="Curitiba-PR, São Paulo-SP..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_rent_value">Valor do Aluguel Mensal (R$)</Label>
            <Input
              id="monthly_rent_value"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.monthly_rent_value}
              onChange={(e) => setFormData({ ...formData, monthly_rent_value: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre o site..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

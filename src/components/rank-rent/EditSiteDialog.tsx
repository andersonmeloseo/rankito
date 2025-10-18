import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EditSiteDialogProps {
  site: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSiteDialog = ({ site, open, onOpenChange }: EditSiteDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    site_name: site.site_name || "",
    site_url: site.site_url || "",
    niche: site.niche || "",
    location: site.location || "",
    monthly_rent_value: site.monthly_rent_value || 0,
    notes: site.notes || "",
  });

  useEffect(() => {
    setFormData({
      site_name: site.site_name || "",
      site_url: site.site_url || "",
      niche: site.niche || "",
      location: site.location || "",
      monthly_rent_value: site.monthly_rent_value || 0,
      notes: site.notes || "",
    });
  }, [site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("rank_rent_sites")
        .update({
          site_name: formData.site_name,
          site_url: formData.site_url,
          niche: formData.niche,
          location: formData.location,
          monthly_rent_value: formData.monthly_rent_value,
          notes: formData.notes,
        })
        .eq("id", site.site_id);

      if (error) throw error;

      toast({
        title: "Site atualizado!",
        description: "Informações do site foram atualizadas",
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-sites"] });
      queryClient.invalidateQueries({ queryKey: ["overview-metrics"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar site:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o site",
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
          <DialogTitle>Editar Site</DialogTitle>
          <DialogDescription>
            {site.site_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">Nome do Site</Label>
              <Input
                id="site_name"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_url">URL do Site</Label>
              <Input
                id="site_url"
                type="url"
                value={formData.site_url}
                onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho</Label>
              <Input
                id="niche"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
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
              value={formData.monthly_rent_value}
              onChange={(e) => setFormData({ ...formData, monthly_rent_value: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
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
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

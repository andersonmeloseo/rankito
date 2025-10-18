import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EditSiteDialogProps {
  site: {
    id: string;
    site_name: string;
    site_url: string;
    niche: string;
    location: string;
    monthly_rent_value: number;
    notes: string | null;
    client_id: string | null;
    user_id: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSiteDialog({ site, open, onOpenChange }: EditSiteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    site_name: site.site_name,
    site_url: site.site_url,
    niche: site.niche,
    location: site.location,
    monthly_rent_value: site.monthly_rent_value,
    notes: site.notes || "",
    client_id: site.client_id || null,
  });

  // Buscar clientes do usuário
  const { data: clients } = useQuery({
    queryKey: ["rank-rent-clients", site.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_clients")
        .select("id, name")
        .eq("user_id", site.user_id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    setFormData({
      site_name: site.site_name,
      site_url: site.site_url,
      niche: site.niche,
      location: site.location,
      monthly_rent_value: site.monthly_rent_value,
      notes: site.notes || "",
      client_id: site.client_id || null,
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
          client_id: formData.client_id,
        })
        .eq("id", site.id);

      if (error) throw error;

      toast({
        title: "Site atualizado!",
        description: "As informações do site foram atualizadas com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-sites"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-metrics"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar site:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o site. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_name">Nome do Site *</Label>
            <Input
              id="site_name"
              value={formData.site_name}
              onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
              placeholder="Meu Site R&R"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_url">URL do Site *</Label>
            <Input
              id="site_url"
              type="url"
              value={formData.site_url}
              onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
              placeholder="https://exemplo.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho *</Label>
              <Input
                id="niche"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                placeholder="Ex: Advogado"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: São Paulo, SP"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_rent_value">Valor do Aluguel Mensal (R$) *</Label>
            <Input
              id="monthly_rent_value"
              type="number"
              step="0.01"
              min="0"
              value={formData.monthly_rent_value}
              onChange={(e) => setFormData({ ...formData, monthly_rent_value: parseFloat(e.target.value) })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente Vinculado</Label>
            <Select
              value={formData.client_id || "none"}
              onValueChange={(value) => 
                setFormData({ ...formData, client_id: value === "none" ? null : value })
              }
            >
              <SelectTrigger id="client_id">
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum cliente</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais sobre o site..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
}

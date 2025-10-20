import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { AlertCircle, Loader2 } from "lucide-react";

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const AddSiteDialog = ({ open, onOpenChange, userId }: AddSiteDialogProps) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { data: limits, isLoading: limitsLoading } = useSubscriptionLimits();

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

    // Validar se usuário tem role 'client'
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !userRole) {
      toast({
        title: "Erro de Permissão",
        description: "Você não tem permissão para cadastrar sites. Entre em contato com o suporte.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("rank_rent_sites").insert({
        created_by_user_id: userId,
        owner_user_id: userId,
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
      console.error('❌ Erro ao cadastrar site:', error);
      
      let errorMessage = error.message || "Erro ao cadastrar site";
      
      // Detectar erro de limite (do trigger)
      if (error.message?.includes('Limite de')) {
        errorMessage = error.message;
      }
      // Detectar erro de RLS
      else if (error.message?.includes('row-level security') || 
          error.message?.includes('policy')) {
        errorMessage = 'Você não tem permissão para cadastrar sites. Entre em contato com o suporte.';
      }
      // Detectar erro de campos obrigatórios
      else if (error.message?.includes('not-null') || 
          error.message?.includes('required')) {
        errorMessage = 'Preencha todos os campos obrigatórios.';
      }
      
      toast({
        title: "Erro ao cadastrar site",
        description: errorMessage,
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

        {!limits?.canCreateSite && !limits?.isUnlimited && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Limite atingido</AlertTitle>
            <AlertDescription>
              Você atingiu o limite de {limits?.plan?.max_sites} sites do plano {limits?.plan?.name}.
              Entre em contato para fazer upgrade e criar mais sites.
            </AlertDescription>
          </Alert>
        )}

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
            <Button 
              type="submit" 
              disabled={loading || limitsLoading || (!limits?.canCreateSite && !limits?.isUnlimited)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!limits?.canCreateSite && !limits?.isUnlimited
                ? `Limite atingido (${limits?.plan?.max_sites} sites)` 
                : loading ? "Cadastrando..." : "Cadastrar Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

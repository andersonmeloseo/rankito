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

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    niche: string;
    contract_start_date: string;
    contract_end_date: string;
    notes: string;
  };
}

export const EditClientDialog = ({ open, onOpenChange, clientId, initialData }: EditClientDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("rank_rent_clients")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          niche: formData.niche,
          contract_start_date: formData.contract_start_date || null,
          contract_end_date: formData.contract_end_date || null,
          notes: formData.notes,
        })
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Cliente atualizado!",
        description: "Os dados do cliente foram atualizados com sucesso",
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-clients"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize as informações do cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nome *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="edit-company">Empresa</Label>
            <Input
              id="edit-company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="edit-niche">Nicho</Label>
            <Input
              id="edit-niche"
              list="edit-niche-suggestions"
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              placeholder="Ex: Advogados, Dentistas..."
            />
            <datalist id="edit-niche-suggestions">
              <option value="Advogados" />
              <option value="Dentistas" />
              <option value="Encanadores" />
              <option value="Eletricistas" />
              <option value="Construtoras" />
              <option value="Imobiliárias" />
              <option value="Clínicas Médicas" />
              <option value="Pet Shops" />
              <option value="Academias" />
              <option value="Restaurantes" />
              <option value="Contadores" />
              <option value="Mecânicos" />
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-contract-start">Data Início</Label>
              <Input
                id="edit-contract-start"
                type="date"
                value={formData.contract_start_date}
                onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-contract-end">Data Fim</Label>
              <Input
                id="edit-contract-end"
                type="date"
                value={formData.contract_end_date}
                onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-notes">Observações</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
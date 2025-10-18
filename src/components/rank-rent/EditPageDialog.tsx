import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface EditPageDialogProps {
  page: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPageDialog = ({ page, open, onOpenChange }: EditPageDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: page.client_id || "",
    phone_number: page.phone_number || "",
    monthly_rent_value: page.monthly_rent_value || 0,
    is_rented: page.is_rented || false,
    status: page.status || "active",
  });

  useEffect(() => {
    setFormData({
      client_id: page.client_id || "",
      phone_number: page.phone_number || "",
      monthly_rent_value: page.monthly_rent_value || 0,
      is_rented: page.is_rented || false,
      status: page.status || "active",
    });
  }, [page]);

  const { data: clients } = useQuery({
    queryKey: ["rank-rent-clients-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_clients")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("rank_rent_pages")
        .update({
          ...formData,
          client_id: formData.client_id || null,
          is_rented: !!formData.client_id,
        })
        .eq("id", page.page_id);

      if (error) throw error;

      toast({
        title: "Página atualizada!",
        description: "Informações da página foram atualizadas",
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-pages"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-page-metrics"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar página:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a página",
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
          <DialogTitle>Editar Página</DialogTitle>
          <DialogDescription>
            {page.page_title || page.page_url}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum (Disponível)</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Telefone da Página</Label>
            <Input
              id="phone"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="(00) 0000-0000"
            />
          </div>

          <div>
            <Label htmlFor="rent">Valor do Aluguel Mensal</Label>
            <Input
              id="rent"
              type="number"
              step="0.01"
              value={formData.monthly_rent_value}
              onChange={(e) => setFormData({ ...formData, monthly_rent_value: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
                <SelectItem value="needs_review">Precisa Revisar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
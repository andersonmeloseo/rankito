import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

interface EditSiteWithRentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: any;
}

export const EditSiteWithRentalDialog = ({ open, onOpenChange, site }: EditSiteWithRentalDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Site basic info
  const [formData, setFormData] = useState({
    site_name: "",
    site_url: "",
    niche: "",
    location: "",
    notes: "",
  });

  // Rental info
  const [isRented, setIsRented] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [contractStartDate, setContractStartDate] = useState<Date | undefined>();
  const [contractEndDate, setContractEndDate] = useState<Date | undefined>();

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["rank-rent-clients"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("rank_rent_clients")
        .select("id, name, email, company")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (site) {
      setFormData({
        site_name: site.site_name || "",
        site_url: site.site_url || "",
        niche: site.niche || "",
        location: site.location || "",
        notes: site.notes || "",
      });
      setIsRented(site.is_rented || false);
      setSelectedClientId(site.client_id || "");
      setMonthlyRent(site.monthly_rent_value?.toString() || "");
      setContractStartDate(site.contract_start_date ? new Date(site.contract_start_date) : undefined);
      setContractEndDate(site.contract_end_date ? new Date(site.contract_end_date) : undefined);
    }
  }, [site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        ...formData,
        is_rented: isRented,
        monthly_rent_value: isRented && monthlyRent ? parseFloat(monthlyRent) : 0,
        client_id: isRented && selectedClientId ? selectedClientId : null,
        contract_start_date: isRented && contractStartDate ? format(contractStartDate, "yyyy-MM-dd") : null,
        contract_end_date: isRented && contractEndDate ? format(contractEndDate, "yyyy-MM-dd") : null,
      };

      const { error } = await supabase
        .from("rank_rent_sites")
        .update(updateData)
        .eq("id", site.site_id);

      if (error) throw error;

      toast({
        title: "✅ Projeto Atualizado!",
        description: "As alterações foram salvas com sucesso",
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["site-details"] });
      queryClient.invalidateQueries({ queryKey: ["overview-metrics"] });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o projeto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
          <DialogDescription>
            Atualize as informações do projeto e configurações de aluguel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Informações do Projeto</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Nome do Projeto *</Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="Ex: Encanador São Paulo"
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
                  placeholder="https://..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Nicho *</Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  placeholder="Ex: Encanador"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: São Paulo - SP"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas sobre o projeto..."
                rows={3}
              />
            </div>
          </div>

          {/* Rental Configuration */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_rented"
                checked={isRented}
                onCheckedChange={(checked) => setIsRented(checked as boolean)}
              />
              <Label htmlFor="is_rented" className="font-semibold">
                Projeto Alugado
              </Label>
            </div>

            {isRented && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent">Valor Mensal (R$) *</Label>
                  <Input
                    id="rent"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2500.00"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !contractStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {contractStartDate ? format(contractStartDate, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={contractStartDate}
                          onSelect={setContractStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Término</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !contractEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {contractEndDate ? format(contractEndDate, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={contractEndDate}
                          onSelect={setContractEndDate}
                          initialFocus
                          className="pointer-events-auto"
                          disabled={(date) => contractStartDate ? date < contractStartDate : false}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
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

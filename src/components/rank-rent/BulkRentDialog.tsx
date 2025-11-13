import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface BulkRentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteIds: string[];
  siteNames: string[];
  onComplete: () => void;
}

export const BulkRentDialog = ({ 
  open, 
  onOpenChange, 
  siteIds, 
  siteNames,
  onComplete,
}: BulkRentDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [contractStartDate, setContractStartDate] = useState<Date | undefined>(new Date());
  const [contractEndDate, setContractEndDate] = useState<Date | undefined>();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId || !monthlyRent || !contractStartDate || !contractEndDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const siteId of siteIds) {
        try {
          const { error } = await supabase
            .from("rank_rent_sites")
            .update({
              client_id: selectedClientId,
              is_rented: true,
              monthly_rent_value: parseFloat(monthlyRent),
              contract_start_date: format(contractStartDate, "yyyy-MM-dd"),
              contract_end_date: format(contractEndDate, "yyyy-MM-dd"),
              next_payment_date: format(contractStartDate, "yyyy-MM-dd"),
            })
            .eq("id", siteId);

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Erro ao alugar site ${siteId}:`, error);
          failCount++;
        }
      }

      toast({
        title: "✅ Aluguel em Lote Concluído!",
        description: `${successCount} projeto(s) alugado(s) com sucesso${failCount > 0 ? `. ${failCount} falhou(s)` : ""}`,
      });

      queryClient.invalidateQueries({ queryKey: ["site-details"] });
      queryClient.invalidateQueries({ queryKey: ["overview-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-site-metrics"] });
      
      onComplete();
      onOpenChange(false);
      
      setSelectedClientId("");
      setMonthlyRent("");
      setContractStartDate(new Date());
      setContractEndDate(undefined);
    } catch (error) {
      console.error("Erro no aluguel em lote:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alugar os projetos",
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
          <DialogTitle>Alugar {siteIds.length} Projeto(s) em Lote</DialogTitle>
          <DialogDescription>
            Configure o aluguel para os projetos selecionados
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/30 rounded p-3 mb-4">
          <p className="text-sm font-medium mb-2">Projetos selecionados:</p>
          <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
            {siteNames.map((name, i) => (
              <li key={i}>• {name}</li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
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
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Término *</Label>
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
                    disabled={(date) => contractStartDate ? date < contractStartDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Alugando...
                </>
              ) : (
                `Alugar ${siteIds.length} Projetos`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

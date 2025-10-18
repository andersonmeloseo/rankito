import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface RenewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
  currentEndDate?: string | null;
  currentRent?: number;
}

export const RenewContractDialog = ({
  open,
  onOpenChange,
  siteId,
  siteName,
  currentEndDate,
  currentRent,
}: RenewContractDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  // Default new end date: current end date + 12 months (or today + 12 months if no current end date)
  const defaultNewEndDate = currentEndDate 
    ? addMonths(new Date(currentEndDate), 12) 
    : addMonths(new Date(), 12);
  
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(defaultNewEndDate);
  const [newRent, setNewRent] = useState(currentRent?.toString() || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEndDate || !newRent) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("rank_rent_sites")
        .update({
          contract_end_date: format(newEndDate, "yyyy-MM-dd"),
          monthly_rent_value: parseFloat(newRent),
        })
        .eq("id", siteId);

      if (error) throw error;

      toast({
        title: "✅ Contrato Renovado!",
        description: `O contrato de ${siteName} foi renovado até ${format(newEndDate, "dd/MM/yyyy")}`,
      });

      queryClient.invalidateQueries({ queryKey: ["site-details"] });
      queryClient.invalidateQueries({ queryKey: ["overview-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-metrics"] });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao renovar contrato:", error);
      toast({
        title: "Erro",
        description: "Não foi possível renovar o contrato",
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
          <DialogTitle>Renovar Contrato</DialogTitle>
          <DialogDescription>
            Atualize o contrato do projeto <strong>{siteName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rent">Valor Mensal (R$) *</Label>
            <Input
              id="rent"
              type="number"
              step="0.01"
              placeholder="Ex: 2500.00"
              value={newRent}
              onChange={(e) => setNewRent(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Nova Data de Término *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newEndDate ? format(newEndDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={setNewEndDate}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
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
              {loading ? "Renovando..." : "Renovar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Building2, Calendar, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface UnrentSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: {
    id: string;
    site_name: string;
    client_name?: string;
    monthly_rent_value?: number;
    contract_start_date?: string;
    contract_end_date?: string;
  };
}

export const UnrentSiteDialog = ({ open, onOpenChange, site }: UnrentSiteDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleUnrent = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("rank_rent_sites")
        .update({
          is_rented: false,
          client_id: null,
          monthly_rent_value: 0,
          contract_start_date: null,
          contract_end_date: null,
          next_payment_date: null,
        })
        .eq("id", site.id);

      if (error) throw error;

      toast({
        title: "✅ Projeto Desalugado!",
        description: `O projeto ${site.site_name} está agora disponível para aluguel`,
      });

      queryClient.invalidateQueries({ queryKey: ["site-details"] });
      queryClient.invalidateQueries({ queryKey: ["overview-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-metrics"] });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao desalugar projeto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível desalugar o projeto",
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
          <DialogTitle>Desalugar Projeto</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja desalugar este projeto?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="default" className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              Esta ação irá remover o cliente e todas as informações de aluguel deste projeto.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Projeto</p>
                <p className="text-base font-semibold">{site.site_name}</p>
              </div>
            </div>

            {site.client_name && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Cliente Atual</p>
                  <p className="text-base font-semibold">{site.client_name}</p>
                </div>
              </div>
            )}

            {site.monthly_rent_value && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Valor Mensal</p>
                  <p className="text-base font-semibold text-success">
                    R$ {Number(site.monthly_rent_value).toLocaleString("pt-BR", { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
              </div>
            )}

            {site.contract_start_date && site.contract_end_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Período do Contrato</p>
                  <p className="text-base font-semibold">
                    {format(new Date(site.contract_start_date), "dd/MM/yyyy", { locale: ptBR })} até{" "}
                    {format(new Date(site.contract_end_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Após desalugar, o projeto voltará ao status <strong className="text-foreground">Disponível</strong> e todas as páginas associadas também serão liberadas.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            variant="destructive" 
            onClick={handleUnrent}
            disabled={loading}
          >
            {loading ? "Desalugando..." : "Desalugar Projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

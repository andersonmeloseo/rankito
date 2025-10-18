import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  totalPagesRented: number;
}

export const DeleteClientDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  totalPagesRented,
}: DeleteClientDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      // First, unlink pages from this client
      if (totalPagesRented > 0) {
        const { error: pagesError } = await supabase
          .from("rank_rent_pages")
          .update({ 
            client_id: null,
            is_rented: false,
            monthly_rent_value: 0
          })
          .eq("client_id", clientId);

        if (pagesError) throw pagesError;
      }

      // Then delete the client
      const { error } = await supabase
        .from("rank_rent_clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: `${clientName} foi removido com sucesso`,
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-clients"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-pages"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir <strong>{clientName}</strong>?
            </p>
            {totalPagesRented > 0 && (
              <p className="text-warning font-medium">
                ⚠️ Este cliente possui {totalPagesRented} página(s) alugada(s). 
                As páginas serão desvinculadas e marcadas como disponíveis.
              </p>
            )}
            <p className="text-sm">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir Cliente"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
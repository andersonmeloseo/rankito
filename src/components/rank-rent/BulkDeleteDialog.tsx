import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { AlertTriangle, Loader2 } from "lucide-react";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteIds: string[];
  siteNames: string[];
  onComplete: () => void;
}

export const BulkDeleteDialog = ({
  open,
  onOpenChange,
  siteIds,
  siteNames,
  onComplete,
}: BulkDeleteDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    setLoading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const siteId of siteIds) {
        try {
          // Deletar páginas
          await supabase.from("rank_rent_pages").delete().eq("site_id", siteId);
          
          // Deletar conversões
          await supabase.from("rank_rent_conversions").delete().eq("site_id", siteId);
          
          // Deletar configurações financeiras
          await supabase.from("rank_rent_financial_config").delete().eq("site_id", siteId);
          
          // Deletar site
          const { error } = await supabase.from("rank_rent_sites").delete().eq("id", siteId);
          
          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Erro ao deletar site ${siteId}:`, error);
          failCount++;
        }
      }

      toast({
        title: "Exclusão em lote concluída",
        description: `${successCount} projeto(s) excluído(s) com sucesso${failCount > 0 ? `. ${failCount} falhou(s)` : ""}`,
      });

      queryClient.invalidateQueries({ queryKey: ["rank-rent-sites"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-site-metrics"] });
      
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro na exclusão em lote:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir os projetos",
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
            <AlertDialogTitle>Excluir {siteIds.length} Projeto(s)</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-semibold text-sm">
                ⚠️ Esta ação é IRREVERSÍVEL e não pode ser desfeita!
              </p>
            </div>
            
            <div>
              <p className="font-medium text-foreground mb-2">
                Os seguintes projetos serão excluídos:
              </p>
              <ul className="space-y-1 text-sm max-h-32 overflow-y-auto bg-muted/30 rounded p-3">
                {siteNames.map((name, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-destructive">✓</span>
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Todos os dados associados (páginas, conversões, analytics) serão removidos permanentemente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              `Excluir ${siteIds.length} Projeto(s)`
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

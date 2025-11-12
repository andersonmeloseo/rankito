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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface DeleteSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
  totalPages: number;
  isRented?: boolean;
}

export const DeleteSiteDialog = ({
  open,
  onOpenChange,
  siteId,
  siteName,
  totalPages,
  isRented = false,
}: DeleteSiteDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isConfirmValid = confirmText === siteName;

  const handleDelete = async () => {
    if (!isConfirmValid) return;
    
    setLoading(true);

    try {
      // 1. Deletar páginas do site
      const { error: pagesError } = await supabase
        .from("rank_rent_pages")
        .delete()
        .eq("site_id", siteId);

      if (pagesError) throw pagesError;

      // 2. Deletar conversões do site
      const { error: conversionsError } = await supabase
        .from("rank_rent_conversions")
        .delete()
        .eq("site_id", siteId);

      if (conversionsError) throw conversionsError;

      // 3. Deletar configurações financeiras do site
      const { error: financialError } = await supabase
        .from("rank_rent_financial_config")
        .delete()
        .eq("site_id", siteId);

      if (financialError) throw financialError;

      // 4. Deletar o site
      const { error: siteError } = await supabase
        .from("rank_rent_sites")
        .delete()
        .eq("id", siteId);

      if (siteError) throw siteError;

      toast({
        title: "Projeto excluído",
        description: `${siteName} e todos os seus dados foram removidos permanentemente`,
      });

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ["rank-rent-sites"] });
      queryClient.invalidateQueries({ queryKey: ["rank-rent-site-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["site-details"] });
      
      // Navegar de volta para o dashboard
      navigate("/dashboard");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o projeto",
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
            <AlertDialogTitle>Excluir Projeto Permanentemente</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-semibold text-sm">
                ⚠️ Esta ação é IRREVERSÍVEL e não pode ser desfeita!
              </p>
            </div>
            
            <div>
              <p className="font-medium text-foreground mb-2">
                Os seguintes dados serão excluídos permanentemente:
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-destructive">✓</span>
                  <span>Todas as {totalPages} página(s) do projeto</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">✓</span>
                  <span>Histórico completo de conversões e page views</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">✓</span>
                  <span>Configurações financeiras</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">✓</span>
                  <span>Dados de tracking e analytics</span>
                </li>
              </ul>
            </div>

            {isRented && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <p className="text-warning text-sm font-medium">
                  ⚠️ Este projeto está atualmente alugado. O cliente perderá acesso a todos os dados.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirm-name" className="text-foreground">
                Para confirmar, digite o nome do projeto: <strong>{siteName}</strong>
              </Label>
              <Input
                id="confirm-name"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite o nome do projeto"
                className="font-mono"
              />
            </div>
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
            onClick={handleDelete}
            disabled={loading || !isConfirmValid}
          >
            {loading ? "Excluindo..." : "Excluir Permanentemente"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

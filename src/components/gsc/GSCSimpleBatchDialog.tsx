import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity, Info, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGSCIndexing } from "@/hooks/useGSCIndexing";
import { useState } from "react";
import { toast } from "sonner";

interface GSCSimpleBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUrls: string[];
  siteId: string;
}

export const GSCSimpleBatchDialog = ({
  isOpen,
  onClose,
  selectedUrls,
  siteId,
}: GSCSimpleBatchDialogProps) => {
  const { quota } = useGSCIndexing({ siteId });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalUrls = selectedUrls.length;
  const remainingQuota = quota?.remaining || 0;
  const totalLimit = quota?.limit || 0;
  const urlsToday = Math.min(totalUrls, remainingQuota);
  const urlsRemaining = Math.max(0, totalUrls - urlsToday);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implementar lógica de distribuição e envio para fila
      toast.success(`${totalUrls} URLs adicionadas à fila de indexação`);
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar URLs à fila:", error);
      toast.error("Erro ao adicionar URLs à fila");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Indexar URLs no GSC
          </DialogTitle>
          <DialogDescription>
            Adicionar URLs selecionadas à fila de indexação do Google Search Console
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Sistema de Indexação</p>
              <p className="text-sm">URLs serão distribuídas automaticamente entre as integrações GSC disponíveis</p>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resumo
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URLs selecionadas:</span>
                  <strong>{totalUrls}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quota disponível hoje:</span>
                  <strong>{remainingQuota}/{totalLimit}</strong>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serão indexadas hoje:</span>
                  <strong className="text-green-600">{urlsToday}</strong>
                </div>
                {urlsRemaining > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nos próximos dias:</span>
                    <strong className="text-orange-600">{urlsRemaining}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Adicionando..." : `Confirmar ${totalUrls} URLs`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity, Info, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GSCBatchIndexingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUrls: { url: string; page_id?: string }[];
  remainingQuota: number;
  totalLimit: number;
  pendingInQueue: number;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const GSCBatchIndexingDialog = ({
  open,
  onOpenChange,
  selectedUrls,
  remainingQuota,
  totalLimit,
  pendingInQueue,
  onConfirm,
  isSubmitting,
}: GSCBatchIndexingDialogProps) => {
  const totalUrls = selectedUrls.length;
  const urlsToday = Math.min(totalUrls, remainingQuota);
  const urlsRemaining = Math.max(0, totalUrls - urlsToday);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Distribuição Inteligente
          </DialogTitle>
          <DialogDescription>
            Distribuição automática entre todas as integrações GSC
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Sistema Inteligente</p>
              <p className="text-sm">URLs distribuídas automaticamente entre todas as contas (200/dia cada)</p>
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
                  <span className="text-muted-foreground">Selecionadas:</span>
                  <strong>{totalUrls}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quota disponível:</span>
                  <strong>{remainingQuota}/{totalLimit}</strong>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hoje:</span>
                  <strong className="text-green-600">{urlsToday}</strong>
                </div>
                {urlsRemaining > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próximos dias:</span>
                    <strong>{urlsRemaining}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Distribuindo..." : `Confirmar ${totalUrls} URLs`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

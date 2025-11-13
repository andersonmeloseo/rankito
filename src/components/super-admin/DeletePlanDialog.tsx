import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeletePlanDialogProps {
  plan: {
    id: string;
    name: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (planId: string) => void;
}

export const DeletePlanDialog = ({
  plan,
  open,
  onOpenChange,
  onConfirm,
}: DeletePlanDialogProps) => {
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = () => {
    if (plan && confirmText === plan.name) {
      onConfirm(plan.id);
      onOpenChange(false);
      setConfirmText("");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setConfirmText("");
  };

  if (!plan) return null;

  const isConfirmValid = confirmText === plan.name;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Excluir Plano
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O plano será permanentemente removido.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Não é possível excluir planos com assinaturas ativas.
            Desative o plano ou migre os usuários antes de excluir.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Você está prestes a excluir o plano:
            </p>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-semibold">{plan.name}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Digite <span className="font-mono font-semibold">{plan.name}</span> para confirmar:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Digite "${plan.name}"`}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid}
            className="transition-all active:scale-[0.98]"
          >
            Excluir Plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

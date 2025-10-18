import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BlockUserDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export const BlockUserDialog = ({ user, open, onOpenChange, onConfirm }: BlockUserDialogProps) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear Usuário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja bloquear o usuário <strong>{user.full_name || user.email}</strong>?
            Este usuário perderá acesso imediato ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do bloqueio (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Violação dos termos de uso, pagamento não identificado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Bloquear Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

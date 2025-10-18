import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DeleteUserDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export const DeleteUserDialog = ({ user, open, onOpenChange, onConfirm }: DeleteUserDialogProps) => {
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
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação é <strong>permanente e irreversível</strong>. Tem certeza que deseja excluir o usuário{" "}
            <strong>{user.full_name || user.email}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
            <p className="text-sm font-medium">O que será deletado:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Conta e perfil do usuário</li>
              <li>Assinaturas e pagamentos vinculados</li>
              <li>Sites e páginas criadas (se aplicável)</li>
              <li>Todas as permissões e acessos</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da exclusão (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Solicitação do usuário, duplicata, violação de termos..."
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
            Excluir Permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

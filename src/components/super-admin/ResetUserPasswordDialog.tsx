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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSuperAdminPasswordReset } from "@/hooks/useSuperAdminPasswordReset";
import { AlertCircle } from "lucide-react";

interface ResetUserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResetUserPasswordDialog = ({ open, onOpenChange }: ResetUserPasswordDialogProps) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const { resetUserPassword, isLoading } = useSuperAdminPasswordReset();

  const handleReset = async () => {
    if (!email || !newPassword || !adminSecret) {
      return;
    }

    const result = await resetUserPassword(email, newPassword, adminSecret);
    
    if (result.success) {
      setEmail("");
      setNewPassword("");
      setAdminSecret("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetar Senha de Usuário</DialogTitle>
          <DialogDescription>
            Como Super Admin, você pode resetar a senha de qualquer usuário. Esta ação não requer que o usuário esteja logado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Usuário</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminSecret">Super Admin Secret</Label>
            <Input
              id="adminSecret"
              type="password"
              placeholder="Token de segurança"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
            />
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                O secret administrativo foi configurado nas variáveis de ambiente. Use-o para autorizar esta operação.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleReset} 
            disabled={!email || !newPassword || !adminSecret || isLoading}
          >
            {isLoading ? "Resetando..." : "Resetar Senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

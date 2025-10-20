import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, UserPlus, MoreVertical, RefreshCw, Ban, Copy } from "lucide-react";
import { useEndClientManagement } from "@/hooks/useEndClientManagement";
import { CreateEndClientDialog } from "./CreateEndClientDialog";
import { toast } from "@/hooks/use-toast";

interface EndClientAccessSectionProps {
  clientId: string;
  clientName: string;
}

export const EndClientAccessSection = ({
  clientId,
  clientName,
}: EndClientAccessSectionProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [resetCredentials, setResetCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const {
    endClientUser,
    isLoading,
    resetPassword,
    revokeAccess,
  } = useEndClientManagement(clientId);

  const handleResetPassword = async () => {
    if (!endClientUser) return;

    try {
      const result = await resetPassword.mutateAsync({
        end_client_user_id: endClientUser.id,
      });

      setResetCredentials({
        email: result.email,
        password: result.temporary_password,
      });
      setShowResetDialog(false);
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  const handleRevokeAccess = async () => {
    if (!endClientUser) return;

    try {
      await revokeAccess.mutateAsync(endClientUser.id);
      setShowRevokeDialog(false);
    } catch (error) {
      console.error("Error revoking access:", error);
    }
  };

  const handleCopyResetCredentials = () => {
    if (!resetCredentials) return;

    const text = `Nova Senha - ${clientName}\n\nEmail: ${resetCredentials.email}\nNova Senha: ${resetCredentials.password}\n\nAcesse: ${window.location.origin}/end-client-portal`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Credenciais copiadas!",
      description: "Envie para o cliente",
    });
    setResetCredentials(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Key className="w-5 h-5" />
          Acesso do Cliente
        </h3>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Key className="w-5 h-5" />
          Acesso do Cliente
        </h3>

        {endClientUser ? (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{endClientUser.email}</p>
                  <Badge variant="default">Ativo</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>Nome: {endClientUser.full_name || "Não informado"}</p>
                  {endClientUser.last_activity_at && (
                    <p>
                      Último acesso:{" "}
                      {new Date(endClientUser.last_activity_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  <p>
                    Criado em:{" "}
                    {new Date(endClientUser.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Redefinir Senha
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowRevokeDialog(true)}
                    className="text-destructive"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Revogar Acesso
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Nenhum acesso criado para este cliente
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Acesso para Cliente
            </Button>
          </div>
        )}
      </div>

      <CreateEndClientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        clientId={clientId}
        clientName={clientName}
      />

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova senha temporária será gerada para {clientName}. O cliente deverá
              alterá-la no próximo acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? "Gerando..." : "Gerar Nova Senha"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar Acesso</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário não poderá mais acessar o portal. Esta ação pode ser revertida
              reativando o acesso posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              disabled={revokeAccess.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeAccess.isPending ? "Revogando..." : "Revogar Acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {resetCredentials && (
        <AlertDialog open={!!resetCredentials} onOpenChange={() => setResetCredentials(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>✅ Senha Redefinida</AlertDialogTitle>
              <AlertDialogDescription>
                Nova senha temporária gerada para {clientName}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-mono text-sm">{resetCredentials.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nova Senha</p>
                <p className="font-mono text-sm">{resetCredentials.password}</p>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleCopyResetCredentials}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Credenciais
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

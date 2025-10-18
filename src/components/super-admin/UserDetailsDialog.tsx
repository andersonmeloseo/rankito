import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserDetailsDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
  if (!user) return null;

  const subscription = user.user_subscriptions?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-medium mb-3">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="font-medium">{user.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{user.whatsapp || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">País</p>
                <p className="font-medium">{user.country_code || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Site Principal</p>
                {user.website ? (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {user.website}
                  </a>
                ) : '-'}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{user.company || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium mb-3">Status</h3>
            <div className="flex gap-2">
              <Badge variant={user.is_active ? "default" : "destructive"}>
                {user.is_active ? "Ativo" : "Bloqueado"}
              </Badge>
              {user.onboarding_completed && (
                <Badge variant="outline">Onboarding Completo</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Subscription Info */}
          {subscription && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-3">Assinatura</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <p className="font-medium">{subscription.subscription_plans?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        subscription.subscription_plans?.price || 0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{subscription.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Início do Período</p>
                    <p className="font-medium">
                      {format(new Date(subscription.current_period_start), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fim do Período</p>
                    <p className="font-medium">
                      {format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  {subscription.trial_end_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fim do Trial</p>
                      <p className="font-medium">
                        {format(new Date(subscription.trial_end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Account Info */}
          <div>
            <h3 className="text-sm font-medium mb-3">Informações da Conta</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">
                  {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última Atividade</p>
                <p className="font-medium">
                  {user.last_activity_at 
                    ? format(new Date(user.last_activity_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : '-'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

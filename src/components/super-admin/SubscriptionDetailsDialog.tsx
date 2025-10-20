import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserSubscription } from "@/hooks/useSubscriptions";
import { useSubscriptionUsage } from "@/hooks/useSubscriptionUsage";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Sparkles,
  CheckCircle2 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SubscriptionDetailsDialogProps {
  subscription: UserSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubscriptionDetailsDialog = ({ 
  subscription, 
  open, 
  onOpenChange 
}: SubscriptionDetailsDialogProps) => {
  const { data: usage } = useSubscriptionUsage(subscription?.user_id);

  if (!subscription) return null;

  const daysRemaining = differenceInDays(
    new Date(subscription.current_period_end),
    new Date()
  );

  const statusColors = {
    trial: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    past_due: "bg-orange-100 text-orange-800",
    canceled: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
  };

  const maxSites = subscription.subscription_plans?.max_sites;
  const maxPages = subscription.subscription_plans?.max_pages_per_site;
  const isUnlimited = !maxSites && !maxPages;

  const sitesPercent = maxSites && usage ? (usage.sites / maxSites) * 100 : 0;
  const pagesPercent = maxPages && usage ? (usage.avgPages / maxPages) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Assinatura</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Usuário */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Informações do Usuário</h3>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{subscription.profiles?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nome:</span>
                <span className="text-sm font-medium">
                  {subscription.profiles?.full_name || "Não informado"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações do Plano */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Plano e Status</h3>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plano:</span>
                <span className="text-sm font-medium">
                  {subscription.subscription_plans?.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={statusColors[subscription.status]}>
                  {subscription.status === 'trial' && 'Trial'}
                  {subscription.status === 'active' && 'Ativa'}
                  {subscription.status === 'past_due' && 'Atrasada'}
                  {subscription.status === 'canceled' && 'Cancelada'}
                  {subscription.status === 'expired' && 'Expirada'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Mensal:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(subscription.subscription_plans?.price || 0)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Período e Datas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Período</h3>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Início:</span>
                <span className="text-sm font-medium">
                  {format(new Date(subscription.current_period_start), "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Término:</span>
                <span className="text-sm font-medium">
                  {format(new Date(subscription.current_period_end), "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dias Restantes:</span>
                <Badge variant={daysRemaining < 7 ? "destructive" : daysRemaining < 30 ? "secondary" : "default"}>
                  {daysRemaining} dias
                </Badge>
              </div>
              {subscription.canceled_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cancelada em:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(subscription.canceled_at), "dd/MM/yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Uso do Plano */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Uso do Plano</h3>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-4">
              {isUnlimited ? (
                <div className="flex items-center gap-2 justify-center py-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">Plano Ilimitado</span>
                </div>
              ) : (
                <>
                  {maxSites && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Sites:</span>
                        <span className="text-sm font-medium">
                          {usage?.sites || 0} / {maxSites}
                        </span>
                      </div>
                      <Progress value={sitesPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {sitesPercent.toFixed(0)}% utilizado
                      </p>
                    </div>
                  )}
                  {maxPages && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Páginas (média por site):</span>
                        <span className="text-sm font-medium">
                          {usage?.avgPages || 0} / {maxPages}
                        </span>
                      </div>
                      <Progress value={pagesPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {pagesPercent.toFixed(0)}% utilizado
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Features do Plano */}
          {subscription.subscription_plans?.features && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Recursos Incluídos</h3>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <ul className="space-y-2">
                    {(subscription.subscription_plans.features as string[]).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Notas */}
          {subscription.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notas</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">{subscription.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

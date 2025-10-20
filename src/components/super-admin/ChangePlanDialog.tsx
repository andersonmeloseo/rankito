import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ChangePlanDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePlanDialog = ({ user, open, onOpenChange }: ChangePlanDialogProps) => {
  const { plans } = useSubscriptionPlans();
  const { updateSubscription, createSubscription } = useSubscriptions();
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const currentPlan = user?.user_subscriptions?.[0]?.subscription_plans;
  const currentSubscription = user?.user_subscriptions?.[0];

  const handleSave = async () => {
    if (!selectedPlanId) return;

    if (currentSubscription?.id) {
      // Atualizar assinatura existente
      await updateSubscription({
        id: currentSubscription.id,
        updates: { plan_id: selectedPlanId }
      });
    } else {
      // Criar nova assinatura
      await createSubscription({
        user_id: user.id,
        plan_id: selectedPlanId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alterar Plano - {user?.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label className="text-sm font-medium">Plano Atual</Label>
            <div className="mt-2">
              {currentPlan ? (
                <Badge variant="default" className="text-sm">
                  {currentPlan.name} - {formatCurrency(currentPlan.price)}
                  {currentPlan.max_sites === null 
                    ? ' (Ilimitado)' 
                    : ` (${currentPlan.max_sites} sites, ${currentPlan.max_pages_per_site} páginas)`
                  }
                </Badge>
              ) : (
                <Badge variant="secondary">Sem plano ativo</Badge>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="plan" className="text-sm font-medium">Novo Plano</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans?.filter(p => p.is_active).map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(plan.price)}/mês
                        {plan.max_sites === null 
                          ? ' • Ilimitado' 
                          : ` • ${plan.max_sites} sites • ${plan.max_pages_per_site} páginas/site`
                        }
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!selectedPlanId}>
              Alterar Plano
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

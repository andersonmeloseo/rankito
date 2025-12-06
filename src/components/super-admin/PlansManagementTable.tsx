import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { EditPlanDialog } from "./EditPlanDialog";
import { CreatePlanDialog } from "./CreatePlanDialog";
import { DeletePlanDialog } from "./DeletePlanDialog";
import { PricingAnalysisCard } from "./PricingAnalysisCard";

export const PlansManagementTable = () => {
  const { plans, isLoading, updatePlan, deletePlan } = useSubscriptionPlans();
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<any>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const togglePlanStatus = (planId: string, currentStatus: boolean) => {
    updatePlan({ id: planId, updates: { is_active: !currentStatus } });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando planos...</div>;
  }

  return (
    <>
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Planos</CardTitle>
              <CardDescription>
                Configure os planos de assinatura disponíveis
              </CardDescription>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.map((plan) => (
                <TableRow key={plan.id} className="h-16">
                  <TableCell className="p-4">
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="font-medium">{formatCurrency(plan.price)}</div>
                    <div className="text-sm text-muted-foreground">/mês</div>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="text-sm">
                      {plan.max_sites ? `${plan.max_sites} sites` : 'Ilimitado'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.max_pages_per_site ? `${plan.max_pages_per_site} páginas/site` : 'Ilimitado'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.max_gsc_integrations ? `${plan.max_gsc_integrations} GSC` : 'GSC Ilimitado'}
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge variant={plan.trial_days > 0 ? "default" : "secondary"}>
                      {plan.trial_days > 0 ? `${plan.trial_days} dias` : 'Sem trial'}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge variant={plan.has_advanced_tracking ? "default" : "outline"}>
                      {plan.has_advanced_tracking ? "✓ Ativo" : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlan(plan)}
                        className="transition-all active:scale-[0.98]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                        className="transition-all active:scale-[0.98]"
                      >
                        {plan.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingPlan(plan)}
                        className="transition-all active:scale-[0.98] text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PricingAnalysisCard />
      {editingPlan && (
        <EditPlanDialog
          plan={editingPlan}
          open={!!editingPlan}
          onOpenChange={(open) => !open && setEditingPlan(null)}
        />
      )}

      <CreatePlanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <DeletePlanDialog
        plan={deletingPlan}
        open={!!deletingPlan}
        onOpenChange={(open) => !open && setDeletingPlan(null)}
        onConfirm={deletePlan}
      />
    </>
  );
};

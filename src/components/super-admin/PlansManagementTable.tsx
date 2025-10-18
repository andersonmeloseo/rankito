import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, EyeOff } from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { EditPlanDialog } from "./EditPlanDialog";

export const PlansManagementTable = () => {
  const { plans, isLoading, updatePlan } = useSubscriptionPlans();
  const [editingPlan, setEditingPlan] = useState<any>(null);

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
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Planos</CardTitle>
          <CardDescription>
            Configure os planos de assinatura disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(plan.price)}</div>
                    <div className="text-sm text-muted-foreground">/mês</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {plan.max_sites ? `${plan.max_sites} sites` : 'Ilimitado'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.max_pages_per_site ? `${plan.max_pages_per_site} páginas/site` : 'Ilimitado'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlan(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                      >
                        {plan.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingPlan && (
        <EditPlanDialog
          plan={editingPlan}
          open={!!editingPlan}
          onOpenChange={(open) => !open && setEditingPlan(null)}
        />
      )}
    </>
  );
};

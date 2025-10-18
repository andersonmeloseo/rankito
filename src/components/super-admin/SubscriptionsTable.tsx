import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, CheckCircle, Plus } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { CreateSubscriptionDialog } from "./CreateSubscriptionDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SubscriptionsTable = () => {
  const { subscriptions, isLoading, updateSubscription } = useSubscriptions();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      trial: { variant: "outline", label: "Trial" },
      active: { variant: "default", label: "Ativa" },
      past_due: { variant: "destructive", label: "Atrasada" },
      canceled: { variant: "secondary", label: "Cancelada" },
      expired: { variant: "destructive", label: "Expirada" },
    };
    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSubscriptions = subscriptions?.filter(sub => 
    statusFilter === "all" || sub.status === statusFilter
  );

  const cancelSubscription = (id: string) => {
    updateSubscription({
      id,
      updates: {
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      },
    });
  };

  const activateSubscription = (id: string) => {
    updateSubscription({
      id,
      updates: {
        status: 'active',
        canceled_at: null,
      },
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando assinaturas...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assinaturas</CardTitle>
              <CardDescription>
                Gerencie todas as assinaturas de usuários
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Assinatura
            </Button>
          </div>
          <div className="flex gap-4 mt-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="past_due">Atrasada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Próximo Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions?.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {subscription.profiles?.full_name || "Sem nome"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.profiles?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{subscription.subscription_plans?.name}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>
                    {formatCurrency(subscription.subscription_plans?.price || 0)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {subscription.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelSubscription(subscription.id)}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      ) : subscription.status === 'canceled' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => activateSubscription(subscription.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Reativar
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateSubscriptionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
};

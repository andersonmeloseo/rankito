import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle } from "lucide-react";
import { useSubscriptionPayments } from "@/hooks/useSubscriptionPayments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PaymentsHistoryTable = () => {
  const { payments, isLoading, updatePayment } = useSubscriptionPayments();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pendente" },
      paid: { variant: "default", label: "Pago" },
      failed: { variant: "destructive", label: "Falhou" },
      refunded: { variant: "secondary", label: "Reembolsado" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredPayments = payments?.filter(payment => 
    statusFilter === "all" || payment.status === statusFilter
  );

  const markAsPaid = (id: string) => {
    updatePayment({
      id,
      updates: {
        status: 'paid',
        payment_date: new Date().toISOString(),
      },
    });
  };

  const markAsFailed = (id: string) => {
    updatePayment({
      id,
      updates: {
        status: 'failed',
      },
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando pagamentos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>
              Todos os pagamentos registrados no sistema
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
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
              <TableHead>Referência</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments?.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {payment.profiles?.full_name || "Sem nome"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payment.profiles?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {payment.user_subscriptions?.subscription_plans?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {payment.reference_month}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell>
                  {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  {payment.payment_date && (
                    <div className="text-sm text-muted-foreground">
                      Pago em {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {payment.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsPaid(payment.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          Pago
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsFailed(payment.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1 text-red-600" />
                          Falhou
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

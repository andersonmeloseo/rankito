import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Edit, Trash2, Plus } from "lucide-react";
import { usePayments, PaymentFilters } from "@/hooks/usePayments";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentsListProps {
  userId: string;
}

export const PaymentsList = ({ userId }: PaymentsListProps) => {
  const [filters, setFilters] = useState<PaymentFilters>({ status: 'all' });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const { payments, summary, isLoading, markAsPaid, deletePayment } = usePayments(userId, filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "Pago", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      overdue: { label: "Atrasado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleQuickMarkAsPaid = async (paymentId: string) => {
    await markAsPaid.mutateAsync({ id: paymentId });
  };

  const handleDelete = async (paymentId: string) => {
    if (confirm("Deseja realmente excluir este pagamento?")) {
      await deletePayment.mutateAsync(paymentId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando pagamentos...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Pagamentos</CardTitle>
          <div className="flex gap-2">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value as PaymentFilters['status'] })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="overdue">Atrasados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cobrança
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum pagamento encontrado.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                Criar primeira cobrança
              </Button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Pagos</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalPaid)}
                  </div>
                  <div className="text-xs text-muted-foreground">{summary.paidCount} pagamentos</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Pendentes</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(summary.totalPending)}
                  </div>
                  <div className="text-xs text-muted-foreground">{summary.pendingCount} pagamentos</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Atrasados</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalOverdue)}
                  </div>
                  <div className="text-xs text-muted-foreground">{summary.overdueCount} pagamentos</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Vencendo em 7 dias</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(summary.dueSoonAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">{summary.dueSoonCount} pagamentos</div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell
                          className="font-medium"
                          onClick={() => setSelectedPaymentId(payment.id)}
                        >
                          {payment.site_name || 'Site sem nome'}
                        </TableCell>
                        <TableCell onClick={() => setSelectedPaymentId(payment.id)}>
                          {payment.client_name || '-'}
                        </TableCell>
                        <TableCell onClick={() => setSelectedPaymentId(payment.id)}>
                          {format(new Date(payment.due_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell onClick={() => setSelectedPaymentId(payment.id)}>
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell onClick={() => setSelectedPaymentId(payment.id)}>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {payment.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickMarkAsPaid(payment.id);
                                }}
                                title="Marcar como pago"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPaymentId(payment.id);
                              }}
                              title="Ver detalhes"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(payment.id);
                              }}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CreatePaymentDialog
        userId={userId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedPaymentId && (
        <PaymentDetailsDialog
          paymentId={selectedPaymentId}
          open={!!selectedPaymentId}
          onOpenChange={(open) => !open && setSelectedPaymentId(null)}
        />
      )}
    </>
  );
};

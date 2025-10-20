import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientFinancials } from "@/hooks/useClientFinancials";
import { PaymentHistoryChart } from "./PaymentHistoryChart";
import { AlertCircle, Clock, DollarSign, CreditCard, CheckCircle } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientFinancialSectionProps {
  clientId: string | null;
  periodDays?: number;
}

export const ClientFinancialSection = ({ clientId, periodDays = 90 }: ClientFinancialSectionProps) => {
  const { data, isLoading } = useClientFinancials(clientId, periodDays);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32 mb-2" />
                <div className="h-3 bg-muted rounded w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, upcomingPayments, recentPayments, payments } = data;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const daysUntilNext = summary.nextDueDate 
    ? differenceInDays(parseISO(summary.nextDueDate), new Date())
    : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">A Pagar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              R$ {formatCurrency(summary.totalPending)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              {summary.pendingCount} {summary.pendingCount === 1 ? 'pagamento' : 'pagamentos'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Em Atraso</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              R$ {formatCurrency(summary.totalOverdue)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {summary.overdueCount} {summary.overdueCount === 1 ? 'pagamento' : 'pagamentos'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              R$ {formatCurrency(summary.totalPaid)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {summary.paidCount} {summary.paidCount === 1 ? 'pagamento' : 'pagamentos'} no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {summary.overdueCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Você possui {summary.overdueCount} pagamento(s) atrasado(s) no valor total de R$ {formatCurrency(summary.totalOverdue)}
          </AlertDescription>
        </Alert>
      )}

      {summary.nextDueDate && daysUntilNext !== null && daysUntilNext <= 7 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Próximo Vencimento</AlertTitle>
          <AlertDescription>
            Pagamento de R$ {formatCurrency(summary.nextDueAmount)} vence em {daysUntilNext === 0 ? 'hoje' : `${daysUntilNext} ${daysUntilNext === 1 ? 'dia' : 'dias'}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Chart */}
      <PaymentHistoryChart payments={payments} />

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Nenhum pagamento encontrado no período selecionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.site_name}</TableCell>
                      <TableCell>{payment.reference_month}</TableCell>
                      <TableCell>{format(parseISO(payment.due_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.payment_date 
                          ? format(parseISO(payment.payment_date), 'dd/MM/yyyy')
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

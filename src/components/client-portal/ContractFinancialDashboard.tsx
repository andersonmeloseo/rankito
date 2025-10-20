import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Payment {
  id: string;
  reference_month: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date?: string;
}

interface ContractFinancialDashboardProps {
  contractStartDate?: string;
  contractEndDate?: string;
  monthlyValue: number;
  autoRenew: boolean;
  daysRemaining?: number | null;
  paymentHistory: Payment[];
  contractStatus: string;
}

export const ContractFinancialDashboard = ({
  contractStartDate,
  contractEndDate,
  monthlyValue,
  autoRenew,
  daysRemaining,
  paymentHistory,
  contractStatus,
}: ContractFinancialDashboardProps) => {
  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const chartData = paymentHistory.map(payment => ({
    month: payment.reference_month,
    amount: Number(payment.amount),
    status: payment.status,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'hsl(var(--color-success))';
      case 'pending': return 'hsl(var(--color-warning))';
      case 'overdue': return 'hsl(var(--color-danger))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      default: return status;
    }
  };

  const paidPayments = paymentHistory.filter(p => p.status === 'paid').length;
  const totalPaid = paymentHistory
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-8">
      {/* Contract Information Table */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Informações do Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Período</p>
              <p className="text-lg font-semibold">{formatDate(contractStartDate)} - {formatDate(contractEndDate)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Valor Mensal</p>
              <p className="text-lg font-semibold">R$ {monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Renovação</p>
              <p className="text-lg font-semibold">{autoRenew ? 'Automática' : 'Manual'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                {contractStatus === 'active' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <p className="text-lg font-semibold">{contractStatus === 'active' ? 'Ativo' : 'Expirado'}</p>
              </div>
            </div>
            {daysRemaining !== null && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Dias Restantes</p>
                <p className="text-lg font-semibold">{daysRemaining > 0 ? daysRemaining : 0} dias</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History Chart */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
              <XAxis 
                dataKey="month" 
                className="text-xs text-muted-foreground"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment List Table */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Detalhes dos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paymentHistory.slice(0, 6).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{payment.reference_month}</p>
                  <p className="text-xs text-muted-foreground">Vencimento: {formatDate(payment.due_date)}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-semibold">R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  {payment.payment_date && (
                    <p className="text-xs text-muted-foreground">Pago em {formatDate(payment.payment_date)}</p>
                  )}
                </div>
                <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
                  {getStatusLabel(payment.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <DollarSign className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-3xl font-bold text-foreground">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Recebido</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-3xl font-bold text-foreground">{paidPayments}</p>
            <p className="text-sm text-muted-foreground mt-1">Pagamentos Realizados</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <CalendarDays className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-3xl font-bold text-foreground">{daysRemaining && daysRemaining > 0 ? daysRemaining : 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Dias até Renovação</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

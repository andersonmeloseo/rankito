import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
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

  // Preparar dados para o gráfico
  const chartData = paymentHistory.map(payment => ({
    month: payment.reference_month,
    amount: Number(payment.amount),
    status: payment.status,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10b981'; // green
      case 'pending':
        return '#f59e0b'; // yellow
      case 'overdue':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Atrasado';
      default:
        return status;
    }
  };

  const paidPayments = paymentHistory.filter(p => p.status === 'paid').length;
  const totalPaid = paymentHistory
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const insights = [
    `💰 Total arrecadado: R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `✅ ${paidPayments} de ${paymentHistory.length} pagamentos realizados`,
    daysRemaining && daysRemaining > 0 ? `📅 ${daysRemaining} dias até renovação` : '',
    autoRenew ? '🔄 Renovação automática ativada' : '⚠️ Renovação manual necessária',
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Cards de Informação do Contrato */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Período do Contrato</p>
                <p className="text-lg font-bold">{formatDate(contractStartDate)}</p>
                <p className="text-sm text-muted-foreground">até {formatDate(contractEndDate)}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            {daysRemaining !== null && (
              <Badge variant={daysRemaining > 30 ? 'default' : 'destructive'} className="w-full justify-center">
                {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Expirado'}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Mensal</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <Badge variant={autoRenew ? 'default' : 'secondary'} className="w-full justify-center">
              {autoRenew ? '🔄 Renovação automática' : '⚠️ Renovação manual'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="text-lg font-bold capitalize">{contractStatus === 'active' ? 'Ativo' : 'Expirado'}</p>
              </div>
              {contractStatus === 'active' ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <Badge variant={contractStatus === 'active' ? 'default' : 'destructive'} className="w-full justify-center">
              {contractStatus === 'active' ? 'Contrato ativo' : 'Contrato expirado'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
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
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista Detalhada de Pagamentos e Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.slice(0, 6).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
                  <div className="flex-1">
                    <p className="font-medium">{payment.reference_month}</p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {formatDate(payment.due_date)}
                    </p>
                  </div>
                  <div className="text-right mr-3">
                    <p className="font-bold">R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    {payment.payment_date && (
                      <p className="text-xs text-muted-foreground">
                        Pago em {formatDate(payment.payment_date)}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
                  >
                    {getStatusLabel(payment.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50">
                <span className="text-xl">{insight.split(' ')[0]}</span>
                <p className="text-sm flex-1">{insight.substring(insight.indexOf(' ') + 1)}</p>
              </div>
            ))}
            
            <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-card rounded-lg">
                <p className="text-2xl font-bold text-green-600">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Recebido</p>
              </div>
              <div className="text-center p-3 bg-card rounded-lg">
                <p className="text-2xl font-bold text-primary">{paidPayments}</p>
                <p className="text-xs text-muted-foreground mt-1">Pagamentos OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

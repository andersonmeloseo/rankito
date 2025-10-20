import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, CartesianGrid } from "recharts";
import { useClientFinancials } from "@/hooks/useClientFinancials";
import { EmptyState } from "./EmptyState";

interface FinancialDashboardProps {
  clientId: string;
  periodDays: number;
  monthlyRevenue: number;
}

export const FinancialDashboard = ({ clientId, periodDays, monthlyRevenue }: FinancialDashboardProps) => {
  const { data: financialData, isLoading } = useClientFinancials(clientId, periodDays);

  if (isLoading) {
    return <div>Carregando dados financeiros...</div>;
  }

  if (!financialData) {
    return <EmptyState title="Dados Financeiros" description="Nenhum dado financeiro disponível" icon="trend" />;
  }

  const { summary, recentPayments } = financialData;

  // Projeção de receita (próximos 3 meses)
  const projectionData = [
    { month: 'Mês 1', value: monthlyRevenue },
    { month: 'Mês 2', value: monthlyRevenue * 1.05 },
    { month: 'Mês 3', value: monthlyRevenue * 1.1 },
  ];

  // Histórico de pagamentos (últimos 6 meses simulado)
  const paymentHistory = recentPayments?.slice(0, 6).map((p: any, i: number) => ({
    month: `Mês ${6 - i}`,
    paid: p.status === 'paid' ? p.amount : 0,
    pending: p.status === 'pending' ? p.amount : 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita recorrente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {(summary.totalPending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalPending > 0 ? 'Aguardando pagamento' : 'Tudo em dia'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(summary.totalPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projeção 3 Meses</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {(monthlyRevenue * 3 * 1.05).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +5% crescimento estimado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Projeção de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentHistory}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="paid" fill="hsl(var(--chart-2))" name="Pago" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pendente" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Payments Table */}
      {recentPayments && recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.slice(0, 5).map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium text-sm">{payment.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {payment.status === 'paid' ? 'Pago' : 
                       payment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

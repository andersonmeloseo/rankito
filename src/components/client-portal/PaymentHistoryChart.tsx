import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ClientPayment } from "@/hooks/useClientFinancials";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentHistoryChartProps {
  payments: ClientPayment[];
}

export const PaymentHistoryChart = ({ payments }: PaymentHistoryChartProps) => {
  // Group payments by month
  const monthlyData = payments.reduce((acc, payment) => {
    const month = format(startOfMonth(parseISO(payment.due_date)), 'MMM/yyyy', { locale: ptBR });
    
    if (!acc[month]) {
      acc[month] = { month, paid: 0, pending: 0, overdue: 0 };
    }
    
    if (payment.status === 'paid') {
      acc[month].paid += payment.amount;
    } else if (payment.status === 'pending') {
      acc[month].pending += payment.amount;
    } else if (payment.status === 'overdue') {
      acc[month].overdue += payment.amount;
    }
    
    return acc;
  }, {} as Record<string, { month: string; paid: number; pending: number; overdue: number }>);

  const chartData = Object.values(monthlyData).reverse();

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico Mensal de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico Mensal de Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
            />
            <Tooltip 
              formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="paid" fill="hsl(var(--chart-2))" name="Pago" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pendente" radius={[4, 4, 0, 0]} />
            <Bar dataKey="overdue" fill="hsl(var(--chart-1))" name="Atrasado" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

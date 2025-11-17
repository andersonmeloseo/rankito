import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueEvolutionData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueEvolutionChartProps {
  data: RevenueEvolutionData[];
  isLoading?: boolean;
}

export const RevenueEvolutionChart = ({ data, isLoading }: RevenueEvolutionChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some(d => d.revenue > 0 || d.orders > 0);

  if (!hasData) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">
              Evolução de Receita
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Últimos 30 dias
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <TrendingUp className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">
              Sem dados de receita ainda
            </p>
            <p className="text-sm text-muted-foreground/70">
              Aguardando primeiras vendas via pixel de e-commerce
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">
            Evolução de Receita
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Últimos 30 dias
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={formatCurrency}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Receita') return formatCurrency(value);
                return `${value} pedidos`;
              }}
              labelFormatter={(label) => {
                try {
                  const date = parseISO(label);
                  return format(date, "dd 'de' MMMM", { locale: ptBR });
                } catch {
                  return label;
                }
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue" 
              name="Receita"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="orders" 
              name="Pedidos"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(221, 83%, 53%)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

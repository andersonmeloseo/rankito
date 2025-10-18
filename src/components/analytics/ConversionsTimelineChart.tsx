import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversionsTimelineChartProps {
  data: Array<{
    date: string;
    whatsapp_click: number;
    phone_click: number;
    email_click: number;
    form_submit: number;
    total: number;
  }>;
  isLoading?: boolean;
}

export const ConversionsTimelineChart = ({ data, isLoading }: ConversionsTimelineChartProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Conversões ao Longo do Tempo
          </CardTitle>
          <CardDescription>Evolução temporal das conversões por tipo</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível para o período selecionado
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Conversões ao Longo do Tempo
        </CardTitle>
        <CardDescription>Evolução temporal das conversões por tipo de evento</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-card-hover)",
                padding: "12px"
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="whatsapp_click" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              name="WhatsApp"
              dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="phone_click" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Telefone"
              dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="email_click" 
              stroke="hsl(var(--chart-5))" 
              strokeWidth={2}
              name="Email"
              dot={{ fill: "hsl(var(--chart-5))", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="form_submit" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              name="Formulário"
              dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

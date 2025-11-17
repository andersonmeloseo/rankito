import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PageViewsDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    percentage: string;
  }>;
  isLoading?: boolean;
}

const COLORS = [
  "hsl(var(--chart-2))", // Mobile - Azul
  "hsl(var(--chart-1))", // Desktop - Verde
  "hsl(var(--chart-3))", // Tablet - Laranja
];

export const PageViewsDistributionChart = ({ data, isLoading }: PageViewsDistributionChartProps) => {
  // ✅ LOG DE DIAGNÓSTICO 3: Dados recebidos pelo componente
  console.log('🎨 [PageViewsDistributionChart] Recebeu dados:', {
    data,
    isLoading,
    dataLength: data?.length,
    firstItem: data?.[0]
  });

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
            <PieChartIcon className="h-5 w-5" />
            Distribuição por Dispositivo
          </CardTitle>
          <CardDescription>Percentual de visualizações por dispositivo</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhuma visualização registrada
        </CardContent>
      </Card>
    );
  }

  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <Card 
      key={JSON.stringify(data)} 
      className="shadow-lg border-border/50 backdrop-blur-sm"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Distribuição por Dispositivo
        </CardTitle>
        <CardDescription>Percentual de visualizações por dispositivo</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="hsl(var(--chart-2))"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-card-hover)",
                padding: "12px"
              }}
              formatter={(value: any, name: string, props: any) => {
                return [`${value} visualizações (${props.payload.percentage}%)`, name];
              }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
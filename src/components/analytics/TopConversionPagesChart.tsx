import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TopConversionPagesChartProps {
  data: Array<{
    page: string;
    conversions: number;
  }>;
  isLoading?: boolean;
}

export const TopConversionPagesChart = ({ data, isLoading }: TopConversionPagesChartProps) => {
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
            <Trophy className="h-5 w-5" />
            Top Páginas com Conversões
          </CardTitle>
          <CardDescription>Páginas que mais convertem</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhuma conversão registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Páginas com Conversões
        </CardTitle>
        <CardDescription>Top 10 páginas que mais geram conversões</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              type="category"
              dataKey="page" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              width={120}
              tickFormatter={(value) => {
                if (value.length > 20) {
                  return value.substring(0, 20) + "...";
                }
                return value;
              }}
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
              formatter={(value: any) => [`${value} conversões`, "Total"]}
            />
            <Bar 
              dataKey="conversions" 
              fill="hsl(var(--chart-1))" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

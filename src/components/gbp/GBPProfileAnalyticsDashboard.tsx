import { useState } from "react";
import { useGBPProfileAnalytics } from "@/hooks/useGBPProfileAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Eye, MousePointer, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GBPProfileAnalyticsDashboardProps {
  profileId: string;
}

export const GBPProfileAnalyticsDashboard = ({ profileId }: GBPProfileAnalyticsDashboardProps) => {
  const [period, setPeriod] = useState(30);
  const { analytics, isLoading, metrics, chartData, actionsByType } = useGBPProfileAnalytics(profileId, period);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const actionsChartData = [
    { name: 'Website', value: actionsByType.website },
    { name: 'Telefone', value: actionsByType.phone },
    { name: 'Direções', value: actionsByType.directions },
  ];

  return (
    <div className="space-y-6">
      {/* Seletor de Período */}
      <div className="flex justify-end gap-2">
        <Button
          variant={period === 7 ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod(7)}
        >
          7 dias
        </Button>
        <Button
          variant={period === 30 ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod(30)}
        >
          30 dias
        </Button>
        <Button
          variant={period === 90 ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod(90)}
        >
          90 dias
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Buscas</p>
                <div className="text-3xl font-bold">{metrics.totalSearches.toLocaleString()}</div>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Ações</p>
                <div className="text-3xl font-bold">{metrics.totalActions.toLocaleString()}</div>
              </div>
              <MousePointer className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visualizações</p>
                <div className="text-3xl font-bold">{metrics.totalViews.toLocaleString()}</div>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha: Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução das Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="searches" stroke="#3b82f6" name="Buscas" />
              <Line type="monotone" dataKey="views" stroke="#8b5cf6" name="Visualizações" />
              <Line type="monotone" dataKey="actions" stroke="#10b981" name="Ações" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras: Ações por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Ações por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={actionsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {analytics?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum dado analítico disponível para o período selecionado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

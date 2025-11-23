import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGBPAnalytics } from "@/hooks/useGBPAnalytics";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Search, MousePointer, Eye, Phone, MapPin, Globe } from "lucide-react";

interface GBPAnalyticsDashboardProps {
  siteId: string;
}

export const GBPAnalyticsDashboard = ({ siteId }: GBPAnalyticsDashboardProps) => {
  const [period, setPeriod] = useState<number>(30);
  const { analytics, isLoading } = useGBPAnalytics(siteId, period);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Carregando analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || !analytics.totals) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            Nenhum dado disponível. Aguarde a primeira sincronização.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { totals, chartData } = analytics;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analytics do Google Business</CardTitle>
              <CardDescription>Métricas de desempenho do seu perfil</CardDescription>
            </div>
            <Select value={period.toString()} onValueChange={(v) => setPeriod(parseInt(v))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              Total de Buscas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.searchesDirect + totals.searchesDiscovery + totals.searchesBranded}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Diretas: {totals.searchesDirect} | Descoberta: {totals.searchesDiscovery}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Total de Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.actionsWebsite + totals.actionsPhone + totals.actionsDirections}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Website: {totals.actionsWebsite} | Telefone: {totals.actionsPhone} | Direções: {totals.actionsDirections}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visualizações do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.profileViews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Evolution chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Buscas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="searches" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Actions bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ações por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Website', value: totals.actionsWebsite, icon: Globe },
              { name: 'Telefone', value: totals.actionsPhone, icon: Phone },
              { name: 'Direções', value: totals.actionsDirections, icon: MapPin },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

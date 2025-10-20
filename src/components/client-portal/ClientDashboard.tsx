import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, TrendingUp, TrendingDown, ExternalLink, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Cell } from 'recharts';

interface ClientDashboardProps {
  analytics: {
    totalPages: number;
    totalConversions: number;
    pageViews: number;
    conversionRate: number;
    dailyStats: any[];
    topPages: any[];
    hourlyStats: any[];
    deviceStats: any[];
    geoStats: any[];
  };
}

export const ClientDashboard = ({ analytics }: ClientDashboardProps) => {
  const {
    totalPages,
    totalConversions,
    pageViews,
    conversionRate,
    dailyStats = [],
    topPages = [],
    hourlyStats = [],
    deviceStats = [],
    geoStats = [],
  } = analytics;

  // Preparar dados do gráfico de tendência
  const trendData = dailyStats.slice(-30).map((stat: any) => ({
    date: new Date(stat.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    conversions: stat.conversions || 0,
    pageViews: stat.pageViews || 0,
  }));

  // Preparar dados do heatmap (simplificado)
  const heatmapData = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const stat = hourlyStats.find((s: any) => s.dayOfWeek === day && s.hour === hour);
      return stat?.count || 0;
    })
  );

  const maxHeatmapValue = Math.max(...heatmapData.flat(), 1);

  const getHeatmapColor = (value: number) => {
    const intensity = value / maxHeatmapValue;
    if (intensity === 0) return 'bg-muted';
    if (intensity < 0.25) return 'bg-green-200';
    if (intensity < 0.5) return 'bg-green-400';
    if (intensity < 0.75) return 'bg-green-600';
    return 'bg-green-800';
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="pages">Top Páginas</TabsTrigger>
        <TabsTrigger value="temporal">Análise Temporal</TabsTrigger>
        <TabsTrigger value="audience">Audiência</TabsTrigger>
      </TabsList>

      {/* TAB: Visão Geral */}
      <TabsContent value="overview" className="space-y-4">
        {/* Gráfico de Tendência */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Tendência de Conversões (últimos 30 dias)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Conversões"
              />
              <Line
                type="monotone"
                dataKey="pageViews"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                name="Visualizações"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resumo Executivo</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de Páginas</span>
                <span className="text-2xl font-bold">{totalPages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de Conversões</span>
                <span className="text-2xl font-bold text-primary">{totalConversions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Visualizações</span>
                <span className="text-2xl font-bold">{pageViews}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Taxa de Conversão</span>
                <span className="text-2xl font-bold text-green-600">{conversionRate.toFixed(2)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Dispositivos</h3>
            <div className="space-y-3">
              {deviceStats.slice(0, 3).map((device: any, idx: number) => {
                const total = deviceStats.reduce((sum: number, d: any) => sum + d.count, 0);
                const percentage = (device.count / total) * 100;
                return (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{device.device}</span>
                      <span className="text-sm text-muted-foreground">
                        {device.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </TabsContent>

      {/* TAB: Top Páginas */}
      <TabsContent value="pages" className="space-y-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Páginas por Conversões</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Página</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPages.slice(0, 10).map((page: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-xs">{page.path}</span>
                      {page.url && (
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {page.conversions}
                  </TableCell>
                  <TableCell className="text-right">{page.pageViews}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{page.conversionRate?.toFixed(2)}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="w-24 ml-auto">
                      <Progress value={page.conversionRate || 0} className="h-2" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      {/* TAB: Análise Temporal */}
      <TabsContent value="temporal" className="space-y-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Mapa de Calor - Horários de Pico
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Conversões por dia da semana e hora do dia
          </p>
          <div className="overflow-x-auto">
            <div className="flex gap-1">
              {/* Coluna de dias da semana */}
              <div className="flex flex-col gap-1 pt-6">
                {dayNames.map((day, idx) => (
                  <div
                    key={idx}
                    className="h-4 text-xs text-muted-foreground flex items-center justify-end pr-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid do heatmap */}
              <div>
                {/* Labels das horas */}
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div
                      key={hour}
                      className="w-4 text-[10px] text-muted-foreground text-center"
                    >
                      {hour % 3 === 0 ? hour : ''}
                    </div>
                  ))}
                </div>
                {/* Células do heatmap */}
                {heatmapData.map((dayData, dayIdx) => (
                  <div key={dayIdx} className="flex gap-1 mb-1">
                    {dayData.map((value, hourIdx) => (
                      <div
                        key={hourIdx}
                        className={`w-4 h-4 rounded-sm ${getHeatmapColor(value)} cursor-pointer hover:opacity-80 transition-opacity`}
                        title={`${dayNames[dayIdx]} ${hourIdx}h: ${value} conversões`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="text-muted-foreground">Menos</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-muted rounded-sm" />
              <div className="w-4 h-4 bg-green-200 rounded-sm" />
              <div className="w-4 h-4 bg-green-400 rounded-sm" />
              <div className="w-4 h-4 bg-green-600 rounded-sm" />
              <div className="w-4 h-4 bg-green-800 rounded-sm" />
            </div>
            <span className="text-muted-foreground">Mais</span>
          </div>
        </Card>
      </TabsContent>

      {/* TAB: Audiência */}
      <TabsContent value="audience" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Distribuição Geográfica */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top 10 Cidades</h3>
            <div className="space-y-3">
              {geoStats.slice(0, 10).map((geo: any, idx: number) => {
                const total = geoStats.reduce((sum: number, g: any) => sum + g.count, 0);
                const percentage = (geo.count / total) * 100;
                return (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{geo.location}</span>
                      <span className="text-sm text-muted-foreground">
                        {geo.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Dispositivos Detalhado */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dispositivos e Navegadores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={deviceStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="device" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Conversões">
                  {deviceStats.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(var(--primary) / ${1 - index * 0.2})`}
                    />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

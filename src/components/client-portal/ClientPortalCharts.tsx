import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';
import { format } from 'date-fns';

interface Conversion {
  created_at: string;
  event_type: string;
}

interface ClientPortalChartsProps {
  dailyStats: any[];
  topPages: any[];
  conversionsByType?: any[];
  liveData?: Conversion[];
}

export const ClientPortalCharts = ({ dailyStats, topPages, conversionsByType, liveData }: ClientPortalChartsProps) => {
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  
  // Mesclar dados históricos com dados ao vivo
  const enhancedDailyStats = useMemo(() => {
    if (!liveData || liveData.length === 0) return dailyStats;
    
    const today = format(new Date(), 'dd/MM');
    const todayConversions = liveData.length;
    
    return dailyStats.map((stat) => {
      if (stat.date === today) {
        return {
          ...stat,
          conversions: stat.conversions + todayConversions,
          isLive: true,
        };
      }
      return stat;
    });
  }, [dailyStats, liveData]);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="pages">Páginas</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Conversões vs Visualizações</CardTitle>
            {liveData && liveData.length > 0 && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                Atualizado em tempo real
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enhancedDailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  name="Conversões"
                  dot={(props: any) => {
                    if (props.payload.isLive) {
                      return (
                        <circle 
                          cx={props.cx} 
                          cy={props.cy} 
                          r={6} 
                          fill="#10b981"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }
                    return <circle {...props} />;
                  }}
                />
                <Line type="monotone" dataKey="pageViews" stroke="#3b82f6" strokeWidth={2} name="Visualizações" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {conversionsByType && conversionsByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={conversionsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {conversionsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="pages">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Páginas com Mais Conversões</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topPages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="path" type="category" width={200} />
                <Tooltip />
                <Bar dataKey="conversions" fill="#10b981" name="Conversões" />
                <Bar dataKey="pageViews" fill="#3b82f6" name="Visualizações" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="timeline">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Evolução Diária</CardTitle>
            {liveData && liveData.length > 0 && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                Atualizado em tempo real
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={enhancedDailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="conversions" 
                  fill="#10b981" 
                  name="Conversões"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="pageViews" 
                  fill="#3b82f6" 
                  name="Visualizações"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

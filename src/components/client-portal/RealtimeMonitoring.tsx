import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Phone, MessageSquare, Mail, MapPin, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

interface RealtimeConversion {
  id: string;
  event_type: string;
  page_path: string;
  page_url: string;
  created_at: string;
  city?: string;
  country?: string;
  metadata?: any;
}

interface RealtimeMonitoringProps {
  conversions: RealtimeConversion[];
  onRefresh?: () => void;
}

export const RealtimeMonitoring = ({ conversions, onRefresh }: RealtimeMonitoringProps) => {
  const [countdown, setCountdown] = useState(30);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefresh?.();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRefresh]);

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  const lastHourConversions = conversions.filter(c => new Date(c.created_at) >= oneHourAgo).length;
  const todayConversions = conversions.filter(c => new Date(c.created_at) >= todayStart).length;
  const last10Conversions = conversions.slice(0, 10);

  const chartData = Array.from({ length: 24 }, (_, i) => {
    const timeSlot = new Date(now.getTime() - (23 - i) * 5 * 60 * 1000);
    const count = conversions.filter(c => {
      const convTime = new Date(c.created_at);
      return convTime >= timeSlot && convTime < new Date(timeSlot.getTime() + 5 * 60 * 1000);
    }).length;
    return { time: timeSlot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), conversions: count };
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'phone_click': return <Phone className="h-3 w-3" />;
      case 'whatsapp_click': return <MessageSquare className="h-3 w-3" />;
      case 'form_submission': return <Mail className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'phone_click': return 'Ligação';
      case 'whatsapp_click': return 'WhatsApp';
      case 'form_submission': return 'Formulário';
      default: return eventType;
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Numbers */}
      <div className="flex items-center gap-8 text-center">
        <div>
          <p className="text-4xl font-bold text-foreground">{last10Conversions.length > 0 ? last10Conversions.length : 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Agora</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-foreground">{lastHourConversions}</p>
          <p className="text-sm text-muted-foreground mt-1">Última Hora</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-foreground">{todayConversions}</p>
          <p className="text-sm text-muted-foreground mt-1">Hoje</p>
        </div>
      </div>

      {/* Chart */}
      <Card className="bg-card border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Atividade das Últimas 2 Horas</CardTitle>
          <Badge variant="outline" className="text-xs">
            Atualiza em {countdown}s
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
              <XAxis 
                dataKey="time" 
                className="text-xs text-muted-foreground" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                interval="preserveStartEnd" 
              />
              <YAxis 
                className="text-xs text-muted-foreground" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '8px' 
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Conversions */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Últimas 10 Conversões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {last10Conversions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhuma conversão recente</p>
            ) : (
              last10Conversions.map((conversion) => (
                <div key={conversion.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-muted-foreground">
                    {getEventIcon(conversion.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{getEventLabel(conversion.event_type)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(conversion.created_at).toLocaleTimeString('pt-BR')}</p>
                    </div>
                    <p className="text-sm truncate">{conversion.page_path}</p>
                    {(conversion.city || conversion.country) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {conversion.city}, {conversion.country}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, TrendingUp, Phone, MessageSquare, Mail, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

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

  // Calcular métricas
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  const lastHourConversions = conversions.filter(
    c => new Date(c.created_at) >= oneHourAgo
  ).length;

  const todayConversions = conversions.filter(
    c => new Date(c.created_at) >= todayStart
  ).length;

  const last10Conversions = conversions.slice(0, 10);

  // Dados para gráfico de linha (últimas 2 horas)
  const chartData = Array.from({ length: 24 }, (_, i) => {
    const timeSlot = new Date(now.getTime() - (23 - i) * 5 * 60 * 1000);
    const count = conversions.filter(c => {
      const convTime = new Date(c.created_at);
      return convTime >= timeSlot && convTime < new Date(timeSlot.getTime() + 5 * 60 * 1000);
    }).length;
    
    return {
      time: timeSlot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      conversions: count,
    };
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'phone_click':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp_click':
        return <MessageSquare className="h-4 w-4" />;
      case 'form_submission':
        return <Mail className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'phone_click':
        return 'Ligação';
      case 'whatsapp_click':
        return 'WhatsApp';
      case 'form_submission':
        return 'Formulário';
      default:
        return eventType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Agora</p>
                <p className="text-4xl font-bold text-red-500">{last10Conversions.length > 0 ? 'ATIVO' : '0'}</p>
              </div>
              <Zap className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Última Hora</p>
                <p className="text-4xl font-bold text-foreground">{lastHourConversions}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hoje</p>
                <p className="text-4xl font-bold text-foreground">{todayConversions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha em Tempo Real */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Últimas 2 Horas</CardTitle>
          <Badge variant="outline" className="animate-pulse">
            Atualiza em {countdown}s
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="time" 
                className="text-xs text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista de Conversões Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Últimas 10 Conversões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {last10Conversions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma conversão recente
              </p>
            ) : (
              last10Conversions.map((conversion, index) => (
                <div 
                  key={conversion.id}
                  className="flex items-center gap-4 p-4 bg-card/50 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getEventIcon(conversion.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {getEventLabel(conversion.event_type)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversion.created_at).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                    <p className="text-sm font-medium truncate">{conversion.page_path}</p>
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

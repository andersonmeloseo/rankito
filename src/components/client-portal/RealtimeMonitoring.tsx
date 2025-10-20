import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, TrendingUp, Phone, MessageSquare, Mail, MapPin, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

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
      case 'phone_click': return <Phone className="h-4 w-4" />;
      case 'whatsapp_click': return <MessageSquare className="h-4 w-4" />;
      case 'form_submission': return <Mail className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-red-500/20 via-red-600/10 to-card border-red-500/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] animate-scale-bounce">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse-strong" />
          <CardContent className="pt-8 pb-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Agora Ao Vivo</p>
                <p className="text-5xl font-extrabold text-red-500 drop-shadow-lg">{last10Conversions.length > 0 ? 'ATIVO' : '0'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/20 backdrop-blur">
                <Zap className="h-10 w-10 text-red-500 animate-pulse-strong drop-shadow-lg" />
              </div>
            </div>
            <Badge className="bg-red-500 text-white text-xs font-bold px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />Status em Tempo Real
            </Badge>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-chart-1/10 via-card to-chart-2/5 border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="pt-8 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">Última Hora</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">{lastHourConversions}</p>
              </div>
              <div className="p-4 rounded-2xl bg-chart-1/10 backdrop-blur border border-chart-1/20">
                <Clock className="h-10 w-10 text-chart-1" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-semibold">📊 Conversões recentes</div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-chart-3/10 via-card to-chart-3/5 border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="pt-8 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">Hoje</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-chart-3 to-chart-4 bg-clip-text text-transparent">{todayConversions}</p>
              </div>
              <div className="p-4 rounded-2xl bg-chart-3/10 backdrop-blur border border-chart-3/20">
                <TrendingUp className="h-10 w-10 text-chart-3" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-semibold">✨ Total do dia</div>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-xl animate-slide-up" style={{ animationDelay: '300ms' }}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-chart-1 to-chart-2">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span>Atividade das Últimas 2 Horas</span>
          </CardTitle>
          <Badge variant="outline" className="animate-pulse-strong text-sm px-4 py-2 bg-primary/10 border-primary/30">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Atualiza em {countdown}s
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRealtimeConversions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
              <XAxis dataKey="time" className="text-xs text-muted-foreground" tick={{ fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
              <YAxis className="text-xs text-muted-foreground" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '12px' }} />
              <Area type="monotone" dataKey="conversions" stroke="hsl(var(--chart-1))" strokeWidth={4} fill="url(#colorRealtimeConversions)" dot={{ fill: 'hsl(var(--chart-1))', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: 'hsl(var(--chart-1))', stroke: '#fff', strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-xl animate-slide-up" style={{ animationDelay: '400ms' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-chart-3 to-chart-4"><Zap className="h-5 w-5 text-white" /></div>
            <span>Últimas 10 Conversões</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {last10Conversions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                  <Zap className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">Nenhuma conversão recente</p>
                <p className="text-xs text-muted-foreground mt-2">As conversões aparecerão aqui em tempo real</p>
              </div>
            ) : (
              last10Conversions.map((conversion, index) => (
                <div key={conversion.id} className="flex items-center gap-4 p-5 bg-gradient-to-r from-card via-card/50 to-card rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-slide-right" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-1/20 to-chart-2/20 flex items-center justify-center text-chart-1 border border-chart-1/20">
                    {getEventIcon(conversion.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs font-semibold bg-chart-1/10 text-chart-1 border-chart-1/20">{getEventLabel(conversion.event_type)}</Badge>
                      <p className="text-xs text-muted-foreground font-medium">{new Date(conversion.created_at).toLocaleTimeString('pt-BR')}</p>
                    </div>
                    <p className="text-sm font-semibold truncate mb-1">{conversion.page_path}</p>
                    {(conversion.city || conversion.country) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{conversion.city}, {conversion.country}</p>
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

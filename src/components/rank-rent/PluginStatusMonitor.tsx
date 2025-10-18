import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PluginStatusMonitorProps {
  userId: string;
}

interface SiteStatus {
  site_name: string;
  last_event: string | null;
  total_events_today: number;
  is_active: boolean;
}

export function PluginStatusMonitor({ userId }: PluginStatusMonitorProps) {
  const { data: sitesStatus, isLoading } = useQuery({
    queryKey: ['plugin-status', userId],
    queryFn: async () => {
      // Get all sites with conversions in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: conversions, error } = await supabase
        .from('rank_rent_conversions')
        .select(`
          site_id,
          created_at,
          rank_rent_sites!inner(
            site_name,
            user_id
          )
        `)
        .eq('rank_rent_sites.user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by site and calculate stats
      const sitesMap = new Map<string, SiteStatus>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      conversions?.forEach((conv: any) => {
        const siteName = conv.rank_rent_sites.site_name;
        const eventDate = new Date(conv.created_at);
        const isToday = eventDate >= today;
        
        if (!sitesMap.has(siteName)) {
          sitesMap.set(siteName, {
            site_name: siteName,
            last_event: conv.created_at,
            total_events_today: isToday ? 1 : 0,
            is_active: true
          });
        } else {
          const current = sitesMap.get(siteName)!;
          if (isToday) {
            current.total_events_today++;
          }
        }
      });

      // Check for inactive sites (no events in last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      sitesMap.forEach((site) => {
        if (site.last_event) {
          const lastEventDate = new Date(site.last_event);
          site.is_active = lastEventDate >= oneDayAgo;
        } else {
          site.is_active = false;
        }
      });

      return Array.from(sitesMap.values());
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Carregando status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const activeSites = sitesStatus?.filter(s => s.is_active).length || 0;
  const inactiveSites = sitesStatus?.filter(s => !s.is_active).length || 0;
  const totalEvents = sitesStatus?.reduce((sum, s) => sum + s.total_events_today, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Sites com Plugin Instalado
        </CardTitle>
        <CardDescription>
          Monitoramento em tempo real dos sites conectados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">{activeSites}</p>
            <p className="text-xs text-muted-foreground">Sites Ativos</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-orange-600">{inactiveSites}</p>
            <p className="text-xs text-muted-foreground">Sem Dados (24h)</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{totalEvents}</p>
            <p className="text-xs text-muted-foreground">Eventos Hoje</p>
          </div>
        </div>

        {/* Sites List */}
        {sitesStatus && sitesStatus.length > 0 ? (
          <div className="space-y-3">
            {sitesStatus.map((site) => (
              <div
                key={site.site_name}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${site.is_active ? 'bg-green-600' : 'bg-orange-600'}`} />
                  <div>
                    <p className="font-medium">{site.site_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {site.last_event
                        ? `Último evento ${formatDistanceToNow(new Date(site.last_event), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}`
                        : 'Sem eventos'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {site.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {site.total_events_today} eventos hoje
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum site com plugin instalado ainda.
            </p>
            <p className="text-xs text-muted-foreground">
              Baixe e instale o plugin em seus sites WordPress para começar o rastreamento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

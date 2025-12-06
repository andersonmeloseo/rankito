import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ExternalLink,
  RefreshCw,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAdsTrackingMetrics, useRecentAdsEvents } from '@/hooks/useAdsTrackingMetrics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface AdsTrackingDashboardProps {
  siteId: string;
  siteUrl?: string;
}

export function AdsTrackingDashboard({ siteId, siteUrl }: AdsTrackingDashboardProps) {
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useAdsTrackingMetrics(siteId);
  const { data: recentEvents, isLoading: eventsLoading, refetch: refetchEvents } = useRecentAdsEvents(siteId);
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'pending' | 'success' | 'fail'>('idle');

  const handleTestConnection = async () => {
    if (!siteUrl) {
      toast.error('URL do site não configurada');
      return;
    }

    setIsTestingConnection(true);
    setTestResult('pending');

    // Generate test URL with fake tracking params
    const testParams = new URLSearchParams({
      gclid: `TEST_GCLID_${Date.now()}`,
      utm_source: 'rankito_test',
      utm_medium: 'test',
      utm_campaign: 'connection_test'
    });

    const testUrl = `${siteUrl}?${testParams.toString()}`;
    
    // Open in new tab
    window.open(testUrl, '_blank');
    
    toast.info('Acesse o link aberto e aguarde 30 segundos...');

    // Wait 30 seconds then check
    setTimeout(async () => {
      await refetchMetrics();
      await refetchEvents();
      
      // Check if we have any test events
      const hasTestEvent = recentEvents?.some(e => 
        e.gclid?.includes('TEST_GCLID') || e.utm_campaign === 'connection_test'
      );

      if (hasTestEvent) {
        setTestResult('success');
        toast.success('Conexão funcionando! Evento de teste capturado.');
      } else {
        setTestResult('fail');
        toast.warning('Evento de teste não detectado ainda. Verifique se o plugin está ativo.');
      }
      setIsTestingConnection(false);
    }, 30000);
  };

  const handleRefresh = async () => {
    await Promise.all([refetchMetrics(), refetchEvents()]);
    toast.success('Dados atualizados!');
  };

  const getStatusIcon = (count: number) => {
    if (count > 0) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <AlertCircle className="h-5 w-5 text-amber-500" />;
  };

  const getStatusBadge = (count: number) => {
    if (count > 0) return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {metricsLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Google Ads</span>
                  {getStatusIcon(metrics?.with_gclid || 0)}
                </div>
                <div className="text-2xl font-bold">{metrics?.with_gclid || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.gclid_percentage || 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Meta fbclid</span>
                  {getStatusIcon(metrics?.with_fbclid || 0)}
                </div>
                <div className="text-2xl font-bold">{metrics?.with_fbclid || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.fbclid_percentage || 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Meta Cookies</span>
                  {getStatusIcon((metrics?.with_fbc || 0) + (metrics?.with_fbp || 0))}
                </div>
                <div className="text-2xl font-bold">
                  {(metrics?.with_fbc || 0) + (metrics?.with_fbp || 0)}
                </div>
                <p className="text-xs text-muted-foreground">fbc + fbp</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">UTM Source</span>
                  {getStatusIcon(metrics?.with_utm_source || 0)}
                </div>
                <div className="text-2xl font-bold">{metrics?.with_utm_source || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.utm_percentage || 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">UTM Campaign</span>
                  {getStatusIcon(metrics?.with_utm_campaign || 0)}
                </div>
                <div className="text-2xl font-bold">{metrics?.with_utm_campaign || 0}</div>
                <p className="text-xs text-muted-foreground">campanhas rastreadas</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Teste de Conexão
          </CardTitle>
          <CardDescription>
            Verifique se o plugin WordPress está capturando os parâmetros de Ads corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-muted/50">
            <Target className="h-4 w-4" />
            <AlertDescription>
              <ol className="list-decimal ml-4 space-y-1 text-sm">
                <li>Clique em "Testar Pixel" para abrir seu site com parâmetros de teste</li>
                <li>Navegue normalmente no site por alguns segundos</li>
                <li>Aguarde 30 segundos para verificação automática</li>
                <li>O sistema confirmará se o evento foi capturado</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleTestConnection}
              disabled={isTestingConnection || !siteUrl}
              className="flex items-center gap-2"
            >
              {isTestingConnection ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Aguardando (30s)...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Testar Pixel
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar Dados
            </Button>

            {testResult === 'success' && (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Funcionando!
              </Badge>
            )}
            {testResult === 'fail' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Não detectado
              </Badge>
            )}
          </div>

          {!siteUrl && (
            <p className="text-sm text-amber-600">
              ⚠️ Configure a URL do site para usar o teste de conexão
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Eventos Recentes com Dados de Ads
          </CardTitle>
          <CardDescription>
            Últimos 20 eventos capturados (últimos 30 dias)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentEvents && recentEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>gclid</TableHead>
                    <TableHead>fbclid</TableHead>
                    <TableHead>utm_source</TableHead>
                    <TableHead>utm_campaign</TableHead>
                    <TableHead>Página</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(event.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.gclid ? (
                          <Badge className="bg-green-500 text-xs">
                            {event.gclid.substring(0, 10)}...
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.fbclid ? (
                          <Badge className="bg-blue-500 text-xs">
                            {event.fbclid.substring(0, 10)}...
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.utm_source ? (
                          <span className="text-sm">{event.utm_source}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.utm_campaign ? (
                          <span className="text-sm">{event.utm_campaign}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {new URL(event.page_url).pathname}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum evento com dados de Ads nos últimos 30 dias</p>
              <p className="text-sm mt-1">
                Certifique-se de que o plugin WordPress v3.1.0 está instalado e ativo
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

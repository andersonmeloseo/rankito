import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Download, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Zap,
  Info,
  TrendingUp
} from 'lucide-react';
import { useRecentAdsEvents } from '@/hooks/useAdsTrackingMetrics';
import { useAdsTrackingCoverage } from '@/hooks/useAdsTrackingCoverage';
import { useCampaignPerformance } from '@/hooks/useCampaignPerformance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CampaignManager } from './CampaignManager';
import { ConversionGoal } from '@/hooks/useConversionGoals';

interface AdsIntegrationTabProps {
  siteId: string;
  siteUrl?: string;
  goals: ConversionGoal[];
}

export function AdsIntegrationTab({ siteId, siteUrl, goals }: AdsIntegrationTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'pending' | 'success' | 'fail'>('idle');
  
  // Period filter
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  // Meta settings
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaTestCode, setMetaTestCode] = useState('');
  const [useTestMode, setUseTestMode] = useState(true);

  // Data hooks
  const { data: coverage, isLoading: coverageLoading, refetch: refetchCoverage } = useAdsTrackingCoverage(siteId);
  const { refetch: refetchEvents } = useRecentAdsEvents(siteId);
  const { data: campaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = useCampaignPerformance(siteId, period);

  const handleTestConnection = async () => {
    if (!siteUrl) {
      toast.error('URL do site não configurada');
      return;
    }

    setIsTestingConnection(true);
    setTestResult('pending');

    const testParams = new URLSearchParams({
      gclid: `TEST_GCLID_${Date.now()}`,
      utm_source: 'rankito_test',
      utm_medium: 'test',
      utm_campaign: 'connection_test'
    });

    const testUrl = `${siteUrl}?${testParams.toString()}`;
    window.open(testUrl, '_blank');
    
    toast.info('Acesse o link aberto e aguarde 30 segundos...');

    setTimeout(async () => {
      // Query directly from database to avoid closure bug
      const { data: testEvents } = await supabase
        .from('rank_rent_conversions')
        .select('id, event_type, gclid, utm_campaign')
        .eq('site_id', siteId)
        .or('gclid.ilike.%TEST_GCLID%,utm_campaign.eq.connection_test')
        .gte('created_at', new Date(Date.now() - 60000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (testEvents && testEvents.length > 0) {
        setTestResult('success');
        const eventType = testEvents[0].event_type;
        toast.success(`Conexão funcionando! Evento "${eventType}" capturado com sucesso.`);
        // Refresh data after successful test
        await Promise.all([refetchCoverage(), refetchEvents()]);
      } else {
        setTestResult('fail');
        toast.warning('Evento de teste não detectado. Verifique se o plugin está ativo no site.');
      }
      setIsTestingConnection(false);
    }, 30000);
  };

  const handleRefresh = async () => {
    await Promise.all([refetchCoverage(), refetchEvents(), refetchCampaigns()]);
    toast.success('Dados atualizados!');
  };

  const handleExportGoogleAds = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-google-ads-conversions', {
        body: {
          siteId,
          startDate: addDays(new Date(), -period).toISOString(),
          endDate: new Date().toISOString()
        }
      });

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `google-ads-conversions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('CSV exportado com sucesso!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMeta = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-meta-conversions', {
        body: {
          siteId,
          startDate: addDays(new Date(), -period).toISOString(),
          endDate: new Date().toISOString(),
          mode: 'export'
        }
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meta-conversions-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`JSON exportado com ${data.total} eventos!`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendToMeta = async () => {
    if (!metaPixelId || !metaAccessToken) {
      toast.error('Configure o Pixel ID e Access Token antes de enviar');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-meta-conversions', {
        body: {
          siteId,
          pixelId: metaPixelId,
          accessToken: metaAccessToken,
          testEventCode: useTestMode ? metaTestCode : undefined,
          startDate: addDays(new Date(), -period).toISOString(),
          endDate: new Date().toISOString(),
          mode: 'send'
        }
      });

      if (error) throw error;

      toast.success(`${data.total_events} eventos enviados para Meta!`);
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIndicator = (count: number, label: string, type: 'google' | 'meta' | 'utm') => {
    const isActive = count > 0;
    
    return (
      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-success opacity-80" />
            ) : (
              <AlertCircle className="h-5 w-5 text-warning opacity-80" />
            )}
            <span className="font-medium text-foreground">{label}</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{count}</span>
          <span className="text-xs text-muted-foreground">
            {isActive ? 'eventos com rastreio' : 'sem dados'}
          </span>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* HERO SECTION - Status da Integração */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
                Status de Integração
              </CardTitle>
              <CardDescription className="mt-1">
                Monitoramento em tempo real da captura de dados de campanhas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button 
                size="sm"
                onClick={handleTestConnection}
                disabled={isTestingConnection || !siteUrl}
                className="flex items-center gap-2"
              >
                {isTestingConnection ? (
                  <>
                    <Zap className="h-4 w-4 animate-pulse" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {coverageLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getStatusIndicator(coverage?.with_gclid || 0, 'Google Ads', 'google')}
              {getStatusIndicator(coverage?.with_fbclid || 0, 'Meta Ads', 'meta')}
              {getStatusIndicator(coverage?.with_utm_source || 0, 'UTM Source', 'utm')}
              {getStatusIndicator(coverage?.with_utm_campaign || 0, 'Campanhas', 'utm')}
            </div>
          )}

          {/* Test Result Badge */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              {testResult === 'success' && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conexão Funcionando
                </Badge>
              )}
              {testResult === 'fail' && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Evento não detectado
                </Badge>
              )}
              {testResult === 'pending' && (
                <Badge variant="secondary">
                  <Zap className="h-3 w-3 mr-1 animate-pulse" />
                  Aguardando teste (30s)...
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Atualizado há {formatDistanceToNow(new Date(), { locale: ptBR, addSuffix: false })}
            </span>
          </div>

          {!siteUrl && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure a URL do site nas configurações para usar o teste de conexão
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* GERENCIADOR DE CAMPANHAS */}
      <CampaignManager siteId={siteId} goals={goals} />

      {/* EXPORTAÇÃO - Accordion Colapsável */}
      <Accordion type="single" collapsible className="space-y-2">
        {/* Google Ads Export */}
        <AccordionItem value="google" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/ads_48dp.png" 
                alt="Google Ads" 
                className="h-6 w-6"
              />
              <div className="text-left">
                <div className="font-medium">Exportar para Google Ads</div>
                <div className="text-xs text-muted-foreground font-normal">CSV para upload de conversões offline</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Como funciona:</strong> Baixe o CSV e faça upload em Google Ads → Ferramentas → Conversões → Upload manual
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-4">
              <Button 
                onClick={handleExportGoogleAds}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando...' : `Exportar CSV (${period} dias)`}
              </Button>

              <a 
                href="https://support.google.com/google-ads/answer/7014069" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Documentação
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Meta Ads Config */}
        <AccordionItem value="meta" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <img 
                src="https://www.facebook.com/images/fb_icon_325x325.png" 
                alt="Meta" 
                className="h-6 w-6"
              />
              <div className="text-left">
                <div className="font-medium">Configurar Meta CAPI</div>
                <div className="text-xs text-muted-foreground font-normal">Envio direto via Conversions API</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pixelId">Pixel ID</Label>
                <Input
                  id="pixelId"
                  placeholder="123456789012345"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAAxxxxxxxxxx..."
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="testMode"
                  checked={useTestMode}
                  onCheckedChange={setUseTestMode}
                />
                <Label htmlFor="testMode">Modo de Teste</Label>
              </div>
              
              {useTestMode && (
                <Input
                  placeholder="TEST12345"
                  value={metaTestCode}
                  onChange={(e) => setMetaTestCode(e.target.value)}
                  className="max-w-[150px] text-sm"
                />
              )}
            </div>

            {useTestMode && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  Eventos aparecerão em Events Manager → Test Events
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button 
                variant="outline"
                onClick={handleExportMeta}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar JSON
              </Button>

              <Button 
                onClick={handleSendToMeta}
                disabled={isSending || !metaPixelId || !metaAccessToken}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSending ? 'Enviando...' : 'Enviar para Meta'}
              </Button>

              <a 
                href="https://developers.facebook.com/docs/marketing-api/conversions-api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Documentação
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

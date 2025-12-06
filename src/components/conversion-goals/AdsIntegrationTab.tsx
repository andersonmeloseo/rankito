import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Download, 
  Send, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  FileSpreadsheet,
  Code,
  Info,
  CalendarIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface AdsIntegrationTabProps {
  siteId: string;
  goals: Array<{ id: string; goal_name: string; is_active: boolean }>;
}

export function AdsIntegrationTab({ siteId, goals }: AdsIntegrationTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Date range
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  });

  // Meta settings
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaTestCode, setMetaTestCode] = useState('');
  const [useTestMode, setUseTestMode] = useState(true);

  // Selected goals
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  const activeGoals = goals.filter(g => g.is_active);

  const handleExportGoogleAds = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-google-ads-conversions', {
        body: {
          siteId,
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
          goalIds: selectedGoalIds.length > 0 ? selectedGoalIds : undefined
        }
      });

      if (error) throw error;

      // Download CSV
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
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
          goalIds: selectedGoalIds.length > 0 ? selectedGoalIds : undefined,
          mode: 'export'
        }
      });

      if (error) throw error;

      // Download JSON
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
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
          goalIds: selectedGoalIds.length > 0 ? selectedGoalIds : undefined,
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

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoalIds(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Exporte conversões com Click IDs (gclid/fbclid) para melhorar a inteligência das suas campanhas.
          O pixel Rankito captura automaticamente esses IDs quando visitantes chegam via anúncios.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Filtros de Exportação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione o período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Metas de Conversão (opcional)</Label>
              <div className="flex flex-wrap gap-2">
                {activeGoals.length > 0 ? (
                  activeGoals.map(goal => (
                    <Badge
                      key={goal.id}
                      variant={selectedGoalIds.includes(goal.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleGoalSelection(goal.id)}
                    >
                      {goal.goal_name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma meta configurada</span>
                )}
              </div>
              {selectedGoalIds.length === 0 && activeGoals.length > 0 && (
                <p className="text-xs text-muted-foreground">Todas as conversões serão incluídas</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="google" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="google" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Google Ads
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Meta Ads
          </TabsTrigger>
        </TabsList>

        {/* Google Ads Tab */}
        <TabsContent value="google" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img 
                  src="https://www.gstatic.com/images/branding/product/1x/ads_48dp.png" 
                  alt="Google Ads" 
                  className="h-6 w-6"
                />
                Google Ads Offline Conversions
              </CardTitle>
              <CardDescription>
                Exporte conversões no formato CSV compatível com Google Ads para upload manual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Como funciona:</strong>
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Clique em "Exportar CSV" para baixar o arquivo</li>
                    <li>Acesse Google Ads → Ferramentas → Conversões</li>
                    <li>Selecione sua conversão → Upload manual</li>
                    <li>Faça upload do arquivo CSV</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleExportGoogleAds}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exportando...' : 'Exportar CSV'}
                </Button>

                <a 
                  href="https://support.google.com/google-ads/answer/7014069" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Documentação Google
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Ads Tab */}
        <TabsContent value="meta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img 
                  src="https://www.facebook.com/images/fb_icon_325x325.png" 
                  alt="Meta" 
                  className="h-6 w-6"
                />
                Meta Conversions API (CAPI)
              </CardTitle>
              <CardDescription>
                Envie conversões diretamente para o Meta via API server-to-server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuration */}
              <div className="space-y-4">
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
                    <div className="flex-1 max-w-xs">
                      <Input
                        placeholder="TEST12345"
                        value={metaTestCode}
                        onChange={(e) => setMetaTestCode(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {useTestMode && (
                  <Alert variant="default" className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Modo de teste ativo. Eventos aparecerão em Events Manager → Test Events.
                      <a 
                        href="https://business.facebook.com/events_manager" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-1 underline"
                      >
                        Abrir Events Manager
                      </a>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  variant="outline"
                  onClick={handleExportMeta}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exportando...' : 'Exportar JSON'}
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
                  Documentação Meta CAPI
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* How to get credentials */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Como obter as credenciais:</strong>
                  <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                    <li>Acesse <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="underline">Events Manager</a></li>
                    <li>Selecione seu Pixel → Configurações</li>
                    <li>Em "Conversions API", gere um Access Token</li>
                    <li>Copie o Pixel ID e o Access Token</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tracking Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status do Rastreamento</CardTitle>
          <CardDescription>
            Verifique se o pixel está capturando os Click IDs corretamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">gclid (Google)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Capturado automaticamente quando visitantes chegam via Google Ads
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">fbclid / fbc / fbp</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Capturado via URL param e cookies do Meta Pixel
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">UTM Parameters</span>
              </div>
              <p className="text-sm text-muted-foreground">
                utm_source, utm_medium, utm_campaign capturados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

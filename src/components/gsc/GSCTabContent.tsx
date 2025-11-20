import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { ClickUpTabTrigger } from '@/components/ui/custom-tabs';
import { Globe, BarChart3, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGSCIntegrations } from '@/hooks/useGSCIntegrations';
import { GSCIntegrationsManager } from './GSCIntegrationsManager';
import { GSCIntegrationHealthCard } from './GSCIntegrationHealthCard';
import { GSCIndexingControls } from './GSCIndexingControls';
import { GSCIndexingAlertsPanel } from './GSCIndexingAlertsPanel';
import { GSCDiscoveredUrlsTable } from './GSCDiscoveredUrlsTable';
import { GSCSitemapsManager } from './GSCSitemapsManager';
import { IndexNowManager } from './IndexNowManager';

interface GSCTabContentProps {
  siteId: string;
  userId: string;
  site: {
    url: string;
    name: string;
  };
}

export const GSCTabContent = ({ siteId, userId, site }: GSCTabContentProps) => {
  const { integrations } = useGSCIntegrations(siteId, userId);
  const [selectedGSCIntegrationId, setSelectedGSCIntegrationId] = useState<string | undefined>();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Auto-select first integration
  useEffect(() => {
    if (integrations && integrations.length > 0 && !selectedGSCIntegrationId) {
      setSelectedGSCIntegrationId(integrations[0].id);
    }
  }, [integrations, selectedGSCIntegrationId]);

  const selectedIntegration = integrations?.find(i => i.id === selectedGSCIntegrationId);

  const handleTestConnection = async (integrationId: string) => {
    setIsTestingConnection(true);
    try {
      const integration = integrations?.find(i => i.id === integrationId);
      if (!integration?.service_account_json) {
        toast.error('Service Account JSON não encontrado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('gsc-test-and-detect', {
        body: {
          service_account_json: integration.service_account_json,
          configured_property_url: integration.gsc_property_url,
          site_url: site.url,
        },
      });

      if (error) throw error;

      if (data?.results?.overall_status === 'healthy') {
        toast.success('✅ Conexão testada com sucesso! GSC integrado corretamente.');
      } else if (data?.results?.overall_status === 'warning') {
        toast.warning('⚠️ Conexão estabelecida com avisos. Verifique configurações.');
      } else {
        toast.error('❌ Problemas detectados na conexão. Verifique credenciais.');
      }
    } catch (error: any) {
      toast.error(`Erro ao testar conexão: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Tabs defaultValue="config" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3 h-12">
        <ClickUpTabTrigger value="config">
          <Globe className="w-4 h-4 mr-2" />
          Configuração
        </ClickUpTabTrigger>
        <ClickUpTabTrigger value="indexing">
          <Globe className="w-4 h-4 mr-2" />
          Indexação GSC
        </ClickUpTabTrigger>
        <ClickUpTabTrigger value="indexnow">
          <Zap className="w-4 h-4 mr-2" />
          IndexNow
        </ClickUpTabTrigger>
      </TabsList>

      {/* Configuração Tab */}
      <TabsContent value="config" className="space-y-6">
        {/* Integrations Management */}
        <GSCIntegrationsManager 
          siteId={siteId} 
          userId={userId}
          site={site}
        />

        {/* Integration Selector */}
        {integrations && integrations.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Integração Ativa</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedGSCIntegrationId} 
                onValueChange={setSelectedGSCIntegrationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma integração" />
                </SelectTrigger>
                <SelectContent>
                  {integrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.connection_name} ({integration.google_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Integration Health Card */}
        {selectedIntegration && (
          <GSCIntegrationHealthCard 
            integration={selectedIntegration}
            onTestConnection={handleTestConnection}
            isTestingConnection={isTestingConnection}
          />
        )}
      </TabsContent>

      {/* Indexação GSC Tab */}
      <TabsContent value="indexing" className="space-y-6">
        {/* Indexing Controls */}
        <GSCIndexingControls 
          siteId={siteId}
          integrationId={selectedGSCIntegrationId}
        />

        {/* Alerts Panel */}
        <GSCIndexingAlertsPanel siteId={siteId} />

        {/* Sub-tabs for Sitemaps and URLs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="urls" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <ClickUpTabTrigger value="sitemaps">
                  <Globe className="h-4 w-4 mr-2" />
                  Por Sitemap
                </ClickUpTabTrigger>
                <ClickUpTabTrigger value="urls">
                  <Globe className="h-4 w-4 mr-2" />
                  Por Página
                </ClickUpTabTrigger>
              </TabsList>

              <TabsContent value="sitemaps">
                <GSCSitemapsManager 
                  siteId={siteId}
                  integrationId={selectedGSCIntegrationId}
                />
              </TabsContent>

              <TabsContent value="urls">
                <GSCDiscoveredUrlsTable 
                  siteId={siteId}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      {/* IndexNow Tab */}
      <TabsContent value="indexnow" className="space-y-6">
        <IndexNowManager siteId={siteId} siteUrl={site.url} />
      </TabsContent>
    </Tabs>
  );
};

import { useState } from 'react';
import { useGSCIntegrations } from '@/hooks/useGSCIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AddGSCIntegrationDialog } from './AddGSCIntegrationDialog';
import { EditGSCIntegrationDialog } from './EditGSCIntegrationDialog';
import { GSCSitemapsManager } from './GSCSitemapsManager';
import { GSCIndexingManager } from './GSCIndexingManager';
import { GSCOverviewDashboard } from './GSCOverviewDashboard';
import { GSCErrorLog } from './GSCErrorLog';
import { GSCIndexingHistory } from './GSCIndexingHistory';
import IndexNowManager from './IndexNowManager';
import { GSCQuickTest } from './GSCQuickTest';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Crown,
  Settings2,
  Send,
  Activity,
  Zap,
} from 'lucide-react';

interface GSCIntegrationsManagerProps {
  siteId: string;
  userId: string;
  site?: {
    url: string;
    name: string;
  };
}

export const GSCIntegrationsManager = ({ siteId, userId, site }: GSCIntegrationsManagerProps) => {
  const {
    integrations,
    isLoading,
    planLimits,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    isCreating,
    isUpdating,
    isDeleting,
  } = useGSCIntegrations(siteId, userId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [integrationToEdit, setIntegrationToEdit] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("configuracao");
  const [indexingSubTab, setIndexingSubTab] = useState("por-pagina");

  const handleAdd = (data: any) => {
    createIntegration.mutate({
      siteId,
      connectionName: data.connectionName,
      serviceAccountJson: data.serviceAccountJson,
    });
    setShowAddDialog(false);
  };

  const handleEditClick = (integration: any) => {
    setIntegrationToEdit(integration);
    setShowEditDialog(true);
  };

  const handleUpdate = (data: any) => {
    updateIntegration.mutate({
      integrationId: data.integrationId,
      connectionName: data.connectionName,
      serviceAccountJson: data.serviceAccountJson,
    });
    setShowEditDialog(false);
  };

  const handleDeleteClick = (integrationId: string) => {
    setIntegrationToDelete(integrationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (integrationToDelete) {
      deleteIntegration.mutate(integrationToDelete);
      setDeleteDialogOpen(false);
      setIntegrationToDelete(null);
    }
  };

  const getHealthBadge = (status: string | null) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Saudável</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Problemas</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Não verificado</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integrações Google Search Console</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando integrações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-4xl">
          <TabsTrigger value="configuracao" variant="gsc" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="indexacao" variant="gsc" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Indexação GSC
          </TabsTrigger>
          <TabsTrigger value="indexnow" variant="gsc" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            IndexNow
          </TabsTrigger>
          <TabsTrigger value="monitoramento" variant="gsc" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoramento
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONFIGURAÇÃO */}
        <TabsContent value="configuracao" className="space-y-6">
          {/* Seção: Integrações GSC */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Integrações Google Search Console
                  </CardTitle>
                  <CardDescription>
                    Configure Service Accounts do Google para submeter URLs e sitemaps
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  disabled={!planLimits?.canAddIntegration}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Integração
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Limits Info */}
              {planLimits && (
                <Alert className="border-blue-200 bg-blue-50/50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Plano {planLimits.planName}:</span>
                      <span>{planLimits.currentCount} / {planLimits.maxIntegrations === null ? '∞' : planLimits.maxIntegrations} integrações</span>
                      {planLimits.remainingIntegrations !== null && planLimits.remainingIntegrations > 0 && (
                        <Badge variant="outline" className="ml-2">+{planLimits.remainingIntegrations} disponíveis</Badge>
                      )}
                      {!planLimits.canAddIntegration && (
                        <Badge className="ml-2 bg-red-100 text-red-700">Limite atingido</Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Lista de Integrações */}
              {integrations.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma integração GSC configurada. Clique em "Adicionar Integração" para começar.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {integrations.map((integration: any) => (
                    <Card key={integration.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg">{integration.connection_name}</h4>
                              {getHealthBadge(integration.health_status)}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>📧 {integration.google_email || 'Email não disponível'}</p>
                              <p>🔗 {integration.gsc_property_url || 'Propriedade não detectada'}</p>
                              {integration.gsc_permission_level && (
                                <p>🔐 Permissão: {integration.gsc_permission_level}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(integration)}
                              disabled={isUpdating}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(integration.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Quick Test */}
              {integrations.length > 0 && site?.url && (
                <>
                  <Separator className="my-6" />
                  <GSCQuickTest siteId={siteId} siteUrl={site.url} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: INDEXAÇÃO */}
        <TabsContent value="indexacao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enviar URLs para Indexação</CardTitle>
              <CardDescription>
                Escolha como deseja submeter suas URLs: página por página ou em lote via sitemap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={indexingSubTab} onValueChange={setIndexingSubTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="por-pagina">Por Página</TabsTrigger>
                  <TabsTrigger value="por-sitemap">Por Sitemap</TabsTrigger>
                </TabsList>

                <TabsContent value="por-pagina" className="mt-6">
                  <GSCIndexingManager siteId={siteId} />
                </TabsContent>

                <TabsContent value="por-sitemap" className="mt-6">
                  <GSCSitemapsManager siteId={siteId} userId={userId} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: INDEXNOW */}
        <TabsContent value="indexnow" className="space-y-6">
          <IndexNowManager siteId={siteId} site={site || { url: '', name: '' }} />
        </TabsContent>

        {/* TAB 4: MONITORAMENTO */}
        <TabsContent value="monitoramento" className="space-y-6">
          {/* Dashboard Executivo */}
          <GSCOverviewDashboard
            siteId={siteId}
            userId={userId}
            site={site || { url: '', name: '' }}
            onNavigateToTab={setActiveTab}
          />

          {/* Log de Erros */}
          <GSCErrorLog siteId={siteId} />

          {/* Histórico Completo */}
          <GSCIndexingHistory siteId={siteId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddGSCIntegrationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        siteId={siteId}
        siteUrl={site?.url || ''}
        onAdd={handleAdd}
        isLoading={isCreating}
      />

      {integrationToEdit && (
        <EditGSCIntegrationDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          integration={integrationToEdit}
          siteUrl={site?.url || ''}
          onUpdate={handleUpdate}
          isLoading={isUpdating}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta integração? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

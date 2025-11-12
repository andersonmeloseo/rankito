import { useState } from 'react';
import { useGSCIntegrations } from '@/hooks/useGSCIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddGSCIntegrationDialog } from './AddGSCIntegrationDialog';
import { GSCSitemapsManager } from './GSCSitemapsManager';
import { GSCIndexingManager } from './GSCIndexingManager';
import { GSCMonitoringDashboard } from './GSCMonitoringDashboard';
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
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Crown,
  FileText,
  Send,
  BarChart3,
} from 'lucide-react';

interface GSCIntegrationsManagerProps {
  siteId: string;
  userId: string;
}

export const GSCIntegrationsManager = ({ siteId, userId }: GSCIntegrationsManagerProps) => {
  const {
    integrations,
    isLoading,
    planLimits,
    createIntegration,
    deleteIntegration,
    isCreating,
    isDeleting,
  } = useGSCIntegrations(siteId, userId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(null);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [selectedIntegrationName, setSelectedIntegrationName] = useState<string>("");

  const handleAdd = (data: any) => {
    createIntegration.mutate({
      siteId,
      connectionName: data.connectionName,
      serviceAccountJson: data.serviceAccountJson,
    });
    setShowAddDialog(false);
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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger 
            value="sitemaps" 
            className="flex items-center gap-2"
            disabled={!selectedIntegrationId}
          >
            <FileText className="h-4 w-4" />
            Sitemaps
          </TabsTrigger>
          <TabsTrigger 
            value="indexing" 
            className="flex items-center gap-2"
            disabled={!selectedIntegrationId}
          >
            <Send className="h-4 w-4" />
            Indexação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <GSCMonitoringDashboard siteId={siteId} userId={userId} />
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Integrações Google Search Console</CardTitle>
              <CardDescription>
                Gerencie conexões com o Google Search Console para indexação automática
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              disabled={!planLimits?.canAddIntegration}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Integração
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Plan Limits Info */}
          {planLimits && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    Plano {planLimits.planName}
                  </p>
                  <p className="text-sm">
                    {planLimits.isUnlimited ? (
                      <>
                        <Crown className="h-3 w-3 inline mr-1 text-yellow-500" />
                        Integrações ilimitadas
                      </>
                    ) : (
                      <>
                        {planLimits.currentCount} / {planLimits.maxIntegrations} integrações usadas
                        {planLimits.remainingIntegrations !== null && (
                          <span className="ml-2 text-muted-foreground">
                            ({planLimits.remainingIntegrations} restantes)
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                {!planLimits.canAddIntegration && !planLimits.isUnlimited && (
                  <Badge variant="destructive">Limite atingido</Badge>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Integrations List */}
          {integrations && integrations.length > 0 ? (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <Card key={integration.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{integration.connection_name}</h4>
                          {integration.is_active ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Conectada
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Desconectada
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            <span className="font-medium">E-mail:</span> {integration.google_email}
                          </p>
                          {integration.gsc_property_url && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Propriedade GSC:</span>{' '}
                              {integration.gsc_property_url}
                            </p>
                          )}
                          {integration.gsc_permission_level && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Permissão:</span>{' '}
                              {integration.gsc_permission_level}
                            </p>
                          )}
                          {integration.last_sync_at && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Última sincronização:</span>{' '}
                              {new Date(integration.last_sync_at).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedIntegrationId(integration.id);
                            setSelectedIntegrationName(integration.connection_name);
                          }}
                          disabled={!integration.is_active}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Gerenciar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
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
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma integração configurada. Adicione uma integração para começar a gerenciar
                indexação via Google Search Console.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemaps">
          {selectedIntegrationId && (
            <GSCSitemapsManager
              integrationId={selectedIntegrationId}
              integrationName={selectedIntegrationName}
            />
          )}
        </TabsContent>

        <TabsContent value="indexing">
          {selectedIntegrationId && (
            <GSCIndexingManager
              integrationId={selectedIntegrationId}
              integrationName={selectedIntegrationName}
              siteId={siteId}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Add Integration Dialog */}
      <AddGSCIntegrationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        siteId={siteId}
        onAdd={handleAdd}
        isLoading={isCreating}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta integração? Você perderá acesso à indexação
              automática via Google Search Console para esta conexão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

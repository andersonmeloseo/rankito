import { useState } from 'react';
import { useGSCIntegrations } from '@/hooks/useGSCIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AddGSCIntegrationDialog } from './AddGSCIntegrationDialog';
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
    startOAuth,
    deleteIntegration,
    isCreating,
    isStartingOAuth,
    isDeleting,
  } = useGSCIntegrations(siteId, userId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(null);

  const handleAdd = (data: any) => {
    createIntegration(data, {
      onSuccess: () => {
        setShowAddDialog(false);
      },
    });
  };

  const handleConnect = (integrationId: string) => {
    startOAuth(integrationId);
  };

  const handleDeleteClick = (integrationId: string) => {
    setIntegrationToDelete(integrationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (integrationToDelete) {
      deleteIntegration(integrationToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setIntegrationToDelete(null);
        },
      });
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
                        {!integration.is_active && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleConnect(integration.id)}
                            disabled={isStartingOAuth}
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Conectar
                          </Button>
                        )}
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

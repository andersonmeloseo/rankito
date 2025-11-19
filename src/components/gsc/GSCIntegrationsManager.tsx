import { useState } from 'react';
import { useGSCIntegrations } from '@/hooks/useGSCIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AddGSCIntegrationDialog } from './AddGSCIntegrationDialog';
import { EditGSCIntegrationDialog } from './EditGSCIntegrationDialog';
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

  const handleAdd = (data: any) => {
    createIntegration.mutate({
      siteId,
      connectionName: data.connectionName,
      serviceAccountJson: data.serviceAccountJson,
      gscPropertyUrl: data.gscPropertyUrl,
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
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const canAddMore = integrations.length < (planLimits?.maxIntegrations || 0);
  const isUnlimited = planLimits?.maxIntegrations === null;

  return (
    <div className="space-y-6">
      {/* Plan Limits Banner */}
      {!isUnlimited && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Plano: <strong>{planLimits?.planName || 'N/A'}</strong> - 
                Integrações GSC: <strong>{integrations.length}/{planLimits?.maxIntegrations || 0}</strong>
              </span>
              {planLimits?.maxIntegrations && integrations.length >= planLimits.maxIntegrations && (
                <Badge className="bg-yellow-100 text-yellow-700">
                  <Crown className="h-3 w-3 mr-1" />
                  Limite Atingido
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Credenciais GSC</CardTitle>
            <CardDescription>Gerencie as Service Accounts conectadas ao Google Search Console</CardDescription>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            disabled={!canAddMore && !isUnlimited}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Credencial
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {integrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma integração configurada</p>
              <p className="text-sm mt-2">Adicione sua primeira Service Account do Google para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration: any) => (
                <Card key={integration.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{integration.connection_name}</h4>
                          {getHealthBadge(integration.health_status)}
                          {!integration.is_active && (
                            <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>📧 {integration.google_email || 'Email não disponível'}</p>
                          <p>🌐 {integration.gsc_property_url || 'Propriedade não configurada'}</p>
                          {integration.last_sync_at && (
                            <p>🔄 Última sincronização: {new Date(integration.last_sync_at).toLocaleString('pt-BR')}</p>
                          )}
                        </div>
                        {integration.last_error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{integration.last_error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(integration)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(integration.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

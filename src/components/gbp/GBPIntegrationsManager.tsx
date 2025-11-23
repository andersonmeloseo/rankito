import { useGBPProfiles } from "@/hooks/useGBPProfiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, Plus, RefreshCcw, TestTube, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddGBPIntegrationDialog } from "./AddGBPIntegrationDialog";

interface GBPIntegrationsManagerProps {
  siteId: string;
  userId: string;
}

export function GBPIntegrationsManager({ siteId, userId }: GBPIntegrationsManagerProps) {
  const { 
    profiles, 
    isLoading, 
    planLimits,
    testConnection,
    isTesting,
    deleteProfile,
    isDeleting,
    syncReviews,
    isSyncing,
    refetch,
  } = useGBPProfiles(siteId, userId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogProfile, setDeleteDialogProfile] = useState<any>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Integrações Google Business Profile</CardTitle>
              <CardDescription>
                Conecte seu perfil do Google Meu Negócio para gerenciar avaliações e posts
              </CardDescription>
              {planLimits && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <span>
                    {planLimits.currentCount} / {planLimits.maxIntegrations ?? '∞'} perfis conectados
                  </span>
                  {!planLimits.canAddMore && (
                    <Badge variant="secondary">Limite atingido</Badge>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              disabled={!planLimits?.canAddMore}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Perfil GBP
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Profiles List */}
      {!profiles || profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Nenhum perfil Google Business conectado
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                disabled={!planLimits?.canAddMore}
              >
                <Plus className="h-4 w-4 mr-2" />
                Conectar Primeiro Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{profile.connection_name}</CardTitle>
                    <CardDescription>{profile.google_email}</CardDescription>
                    {profile.business_name && (
                      <p className="text-sm font-medium mt-2">{profile.business_name}</p>
                    )}
                    {profile.business_address && (
                      <p className="text-xs text-muted-foreground">{profile.business_address}</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      profile.health_status === 'healthy' ? 'default' :
                      profile.health_status === 'warning' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {profile.health_status === 'healthy' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {profile.health_status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {profile.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection.mutate(profile.id)}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Testar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncReviews.mutate()}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogProfile(profile)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
                {profile.last_error && (
                  <p className="text-sm text-destructive mt-2">{profile.last_error}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Integration Dialog */}
      <AddGBPIntegrationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        siteId={siteId}
        siteUrl=""
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteDialogProfile}
        onOpenChange={() => setDeleteDialogProfile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Perfil GBP?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o perfil "{deleteDialogProfile?.connection_name}" e todos os dados sincronizados.
              Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialogProfile) {
                  deleteProfile.mutate(deleteDialogProfile.id);
                  setDeleteDialogProfile(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

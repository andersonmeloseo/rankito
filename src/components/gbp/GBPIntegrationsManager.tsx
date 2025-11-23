import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Plus, RefreshCw, Trash2, TestTube } from "lucide-react";
import { useGBPProfiles } from "@/hooks/useGBPProfiles";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface GBPIntegrationsManagerProps {
  siteId: string;
  userId: string;
}

export const GBPIntegrationsManager = ({ siteId, userId }: GBPIntegrationsManagerProps) => {
  const {
    profiles,
    planLimits,
    isLoading,
    isStartingOAuth,
    isTestingConnection,
    isDeletingProfile,
    isSyncingReviews,
    startOAuth,
    testConnection,
    deleteProfile,
    syncReviews,
  } = useGBPProfiles(siteId, userId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [connectionName, setConnectionName] = useState("");
  const [deleteDialogProfile, setDeleteDialogProfile] = useState<string | null>(null);

  const handleStartOAuth = () => {
    if (!connectionName.trim()) {
      return;
    }
    startOAuth(connectionName);
  };

  const canAddMore = planLimits && (
    planLimits.maxIntegrations === null || 
    planLimits.currentCount < planLimits.maxIntegrations
  );

  return (
    <div className="space-y-6">
      {/* Header with limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Integrações Google Business Profile</CardTitle>
              <CardDescription>
                Conecte seu perfil do Google Meu Negócio para gerenciar avaliações e posts
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              disabled={!canAddMore || isStartingOAuth}
            >
              <Plus className="w-4 h-4 mr-2" />
              Conectar Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {planLimits && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {planLimits.currentCount} / {planLimits.maxIntegrations ?? '∞'} integrações utilizadas
              </span>
              {!canAddMore && (
                <Badge variant="secondary">Limite atingido</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profiles list */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Carregando integrações...</p>
          </CardContent>
        </Card>
      ) : !profiles || profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Nenhuma integração Google Business configurada</p>
              <Button onClick={() => setShowAddDialog(true)} disabled={!canAddMore}>
                <Plus className="w-4 h-4 mr-2" />
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
                      <p className="text-sm font-medium">{profile.business_name}</p>
                    )}
                    {profile.business_address && (
                      <p className="text-xs text-muted-foreground">{profile.business_address}</p>
                    )}
                  </div>
                  <Badge variant={
                    profile.health_status === 'healthy' ? 'default' :
                    profile.health_status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {profile.health_status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {profile.health_status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {profile.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(profile.id)}
                    disabled={isTestingConnection}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Testar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncReviews()}
                    disabled={isSyncingReviews}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogProfile(profile.id)}
                    disabled={isDeletingProfile}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
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

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar Google Business Profile</DialogTitle>
            <DialogDescription>
              Dê um nome para esta conexão e autorize o acesso ao seu perfil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connection-name">Nome da Conexão</Label>
              <Input
                id="connection-name"
                placeholder="Ex: Loja Centro - São Paulo"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStartOAuth} disabled={!connectionName.trim() || isStartingOAuth}>
              {isStartingOAuth ? 'Iniciando...' : 'Conectar com Google'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteDialogProfile} onOpenChange={() => setDeleteDialogProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Integração GBP?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a integração e todos os dados sincronizados (avaliações, posts, analytics).
              Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialogProfile) {
                  deleteProfile(deleteDialogProfile);
                  setDeleteDialogProfile(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

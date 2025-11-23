import { useState } from 'react';
import { useGBPProfiles } from '@/hooks/useGBPProfiles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Store, MapPin, Mail, Phone, Activity, Trash2, RefreshCw } from 'lucide-react';
import { AddGBPIntegrationDialog } from './AddGBPIntegrationDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface GBPDashboardTabProps {
  userId: string;
}

export function GBPDashboardTab({ userId }: GBPDashboardTabProps) {
  const { profiles, isLoading, planLimits, testConnection, isTesting, deleteProfile, isDeleting, syncReviews, isSyncing } = useGBPProfiles(userId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const canAddMore = planLimits?.canAddMore ?? false;
  const currentCount = planLimits?.currentCount ?? 0;
  const maxIntegrations = planLimits?.maxIntegrations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-8 h-8 text-primary" />
            Google Business Profile
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie seus perfis do Google Meu Negócio, reviews e posts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {planLimits && (
            <Badge variant="secondary" className="text-sm">
              {maxIntegrations === null 
                ? 'Integrações Ilimitadas' 
                : `${currentCount} / ${maxIntegrations} perfis`}
            </Badge>
          )}
          <Button 
            onClick={() => setShowAddDialog(true)}
            disabled={!canAddMore}
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Perfil GBP
          </Button>
        </div>
      </div>

      {/* Lista de Perfis */}
      {!profiles || profiles.length === 0 ? (
        <Card className="p-12 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum perfil GBP conectado</h3>
          <p className="text-muted-foreground mb-6">
            Conecte seu Google Business Profile para gerenciar reviews, posts e analytics
          </p>
          <Button onClick={() => setShowAddDialog(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Conectar Primeiro Perfil
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Store className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-semibold">{profile.business_name || profile.connection_name}</h3>
                      <p className="text-sm text-muted-foreground">{profile.google_email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {profile.business_address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.business_address}</span>
                      </div>
                    )}
                    {profile.business_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{profile.business_phone}</span>
                      </div>
                    )}
                    {profile.business_categories && profile.business_categories.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <Activity className="w-4 h-4" />
                        <div className="flex flex-wrap gap-1">
                          {profile.business_categories.map((cat, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <Badge 
                      variant={profile.health_status === 'healthy' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {profile.health_status === 'healthy' ? '✓ Ativo' : '✗ Erro'}
                    </Badge>
                    {profile.last_sync_at && (
                      <span className="text-xs text-muted-foreground">
                        Última sync: {new Date(profile.last_sync_at).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {profile.last_error && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">{profile.last_error}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection.mutate(profile.id)}
                    disabled={isTesting}
                  >
                    <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProfileToDelete(profile.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Botão de Sync Global */}
      {profiles && profiles.length > 0 && (
        <Button
          variant="outline"
          onClick={() => syncReviews.mutate()}
          disabled={isSyncing}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar Todos os Reviews
        </Button>
      )}

      {/* Dialog para adicionar perfil */}
      <AddGBPIntegrationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
        }}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este perfil GBP? Isso também removerá todas as associações com projetos, reviews e posts.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (profileToDelete) {
                  deleteProfile.mutate(profileToDelete);
                  setProfileToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

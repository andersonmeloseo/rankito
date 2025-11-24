import { useState } from 'react';
import { useGBPProfiles } from '@/hooks/useGBPProfiles';
import { useGBPMockData } from '@/hooks/useGBPMockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Store, MapPin, Mail, Phone, Activity, Trash2, RefreshCw, Sparkles, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { AddGBPIntegrationDialog } from './AddGBPIntegrationDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GBPProfileEditor } from './GBPProfileEditor';
import { GBPProfileReviewsManager } from './GBPProfileReviewsManager';
import { GBPProfilePostsManager } from './GBPProfilePostsManager';
import { GBPProfileAnalyticsDashboard } from './GBPProfileAnalyticsDashboard';
import { GBPPhotosManager } from './GBPPhotosManager';
import { GBPQuestionsManager } from './GBPQuestionsManager';
import { GBPProfileOverview } from './GBPProfileOverview';
import { GBPProfileCard } from './GBPProfileCard';
interface GBPDashboardTabProps {
  userId: string;
}
export function GBPDashboardTab({
  userId
}: GBPDashboardTabProps) {
  const {
    profiles,
    isLoading,
    planLimits,
    testConnection,
    isTesting,
    deleteProfile,
    isDeleting,
    syncReviews,
    isSyncing
  } = useGBPProfiles(userId);
  const {
    generateMockData,
    isGenerating
  } = useGBPMockData();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  if (isLoading) {
    return <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>;
  }
  const canAddMore = planLimits?.canAddMore ?? false;
  const currentCount = planLimits?.currentCount ?? 0;
  const maxIntegrations = planLimits?.maxIntegrations;

  // Separate mock and real profiles
  const mockProfiles = profiles?.filter(p => p.is_mock) || [];
  const realProfiles = profiles?.filter(p => !p.is_mock) || [];
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-8 h-8 text-primary" />
            Google Business Profile (em breve nos melhores cinemas... 😊) 
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie seus perfis do Google Meu Negócio, reviews e posts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {planLimits && <Badge variant="secondary" className="text-sm">
              {maxIntegrations === null ? 'Integrações Ilimitadas' : `${currentCount} / ${maxIntegrations} perfis`}
            </Badge>}
          <Button onClick={() => setShowAddDialog(true)} disabled={!canAddMore} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Perfil GBP
          </Button>
        </div>
      </div>

      {/* Lista de Perfis */}
      {!profiles || profiles.length === 0 ? <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Card 1: Dados de Demonstração */}
          <Card className="relative overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-full -mr-16 -mt-16 opacity-50" />
            <CardContent className="pt-8 pb-6 px-6 relative">
              <Sparkles className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Dados de Demonstração</h3>
              <p className="text-muted-foreground mb-4">
                Explore todas as funcionalidades com dados realistas
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  5 perfis completos prontos
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Reviews, fotos e analytics mockados
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Teste todas as funcionalidades
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Perfeito para aprender o sistema
                </li>
              </ul>
              <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => generateMockData({
            clearExisting: false
          })} disabled={isGenerating}>
                <Sparkles className="mr-2 h-5 w-5" />
                {isGenerating ? 'Gerando...' : 'Gerar Perfis Demo'}
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Conectar Perfil Real */}
          <Card className="relative overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full -mr-16 -mt-16 opacity-50" />
            <CardContent className="pt-8 pb-6 px-6 relative">
              <LinkIcon className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Conectar Perfil Real</h3>
              <p className="text-muted-foreground mb-4">
                Sincronize seu Google Business Profile
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Sincronização automática
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Reviews e posts reais
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Analytics em tempo real
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Dados do Google My Business
                </li>
              </ul>
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowAddDialog(true)}>
                <LinkIcon className="mr-2 h-5 w-5" />
                Conectar Primeiro Perfil
              </Button>
            </CardContent>
          </Card>
        </div> : <div className="space-y-8">
          {/* Perfis Mockados */}
          {mockProfiles.length > 0 && <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Perfis de Demonstração</h3>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Demo
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => generateMockData({
            clearExisting: true
          })} disabled={isGenerating} className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerar Dados
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockProfiles.map(profile => <GBPProfileCard key={profile.id} profile={profile} onClick={() => setSelectedProfile(profile)} />)}
              </div>
            </div>}

          {/* Perfis Reais */}
          {realProfiles.length > 0 && <div>
              {mockProfiles.length > 0 && <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Perfis Conectados</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <LinkIcon className="w-3 h-3 mr-1" />
                    Real
                  </Badge>
                </div>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {realProfiles.map(profile => <GBPProfileCard key={profile.id} profile={profile} onClick={() => setSelectedProfile(profile)} />)}
              </div>
            </div>}
        </div>}

      {/* Botão de Sync Global */}
      {profiles && profiles.length > 0 && <Button variant="outline" onClick={() => syncReviews.mutate()} disabled={isSyncing} className="w-full">
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar Todos os Reviews
        </Button>}

      {/* Dialog para adicionar perfil */}
      <AddGBPIntegrationDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => {
      setShowAddDialog(false);
    }} />

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
            <AlertDialogAction onClick={() => {
            if (profileToDelete) {
              deleteProfile.mutate(profileToDelete);
              setProfileToDelete(null);
            }
          }} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Gerenciamento de Perfil */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              {selectedProfile?.business_name || selectedProfile?.connection_name}
              {selectedProfile?.is_mock && <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Demo
                </Badge>}
            </DialogTitle>
          </DialogHeader>

          {selectedProfile && <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="edit">Editar</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="photos">Fotos</TabsTrigger>
                <TabsTrigger value="questions">Perguntas</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <GBPProfileOverview profile={selectedProfile} />
              </TabsContent>

              <TabsContent value="edit" className="space-y-4">
                <GBPProfileEditor profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <GBPProfileReviewsManager profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="posts" className="space-y-4">
                <GBPProfilePostsManager profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <GBPProfileAnalyticsDashboard profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="photos" className="space-y-4">
                <GBPPhotosManager profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="questions" className="space-y-4">
                <GBPQuestionsManager profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="info" className="space-y-4">
                <div className="p-6 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-4">Informações Técnicas</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono">{selectedProfile.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedProfile.health_status === 'healthy' ? 'default' : 'destructive'}>
                        {selectedProfile.health_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verificação:</span>
                      <span>{selectedProfile.verification_status || 'N/A'}</span>
                    </div>
                    {selectedProfile.last_sync_at && <div className="flex justify-between">
                        <span className="text-muted-foreground">Última Sync:</span>
                        <span>{new Date(selectedProfile.last_sync_at).toLocaleString('pt-BR')}</span>
                      </div>}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="secondary">
                        {selectedProfile.is_mock ? 'Demonstração' : 'Conectado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>}
        </DialogContent>
      </Dialog>
    </div>;
}
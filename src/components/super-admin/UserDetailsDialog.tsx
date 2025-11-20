import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Package, FileText, TrendingUp, Server } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserResources } from "@/hooks/useUserResources";
import { Skeleton } from "@/components/ui/skeleton";

interface UserDetailsDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
  if (!user) return null;

  const subscription = user.user_subscriptions?.[0];
  const { data: resources, isLoading: resourcesLoading } = useUserResources(user?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-medium mb-3">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="font-medium">{user.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{user.whatsapp || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">País</p>
                <p className="font-medium">{user.country_code || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Site Principal</p>
                {user.website ? (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {user.website}
                  </a>
                ) : '-'}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{user.company || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium mb-3">Status</h3>
            <div className="flex gap-2">
              <Badge variant={user.is_active ? "default" : "destructive"}>
                {user.is_active ? "Ativo" : "Bloqueado"}
              </Badge>
              {user.onboarding_completed && (
                <Badge variant="outline">Onboarding Completo</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Subscription Info */}
          {subscription && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-3">Assinatura</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <p className="font-medium">{subscription.subscription_plans?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        subscription.subscription_plans?.price || 0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{subscription.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Início do Período</p>
                    <p className="font-medium">
                      {format(new Date(subscription.current_period_start), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fim do Período</p>
                    <p className="font-medium">
                      {format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  {subscription.trial_end_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fim do Trial</p>
                      <p className="font-medium">
                        {format(new Date(subscription.trial_end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Resource Consumption */}
          <div>
            <h3 className="text-sm font-medium mb-3">Consumo de Recursos</h3>
            
            {resourcesLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              </div>
            ) : resources && resources.sites.length > 0 ? (
              <>
                {/* Metrics Cards */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Sites</p>
                      </div>
                      <div className="text-2xl font-bold">{resources.summary.totalSites}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Páginas</p>
                      </div>
                      <div className="text-2xl font-bold">
                        {resources.summary.totalPages.toLocaleString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Conversões</p>
                      </div>
                      <div className="text-2xl font-bold">
                        {resources.summary.totalConversions.toLocaleString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">GSC</p>
                      </div>
                      <div className="text-2xl font-bold">{resources.summary.totalGscIntegrations}</div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Sites List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Sites Detalhados</h4>
                  {resources.sites.map(site => (
                    <div key={site.id} className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{site.site_name}</p>
                          <a 
                            href={site.site_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {site.site_url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <Badge variant="outline">{site.niche}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Páginas</p>
                          <p className="font-medium">{site.total_pages.toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Conversões</p>
                          <p className="font-medium">{site.total_conversions.toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">GSC</p>
                          <p className="font-medium">{site.gsc_integrations_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Indexações</p>
                          <p className="font-medium">{site.indexing_requests_count.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Este usuário não possui sites cadastrados
              </div>
            )}
          </div>

          <Separator />

          {/* Account Info */}
          <div>
            <h3 className="text-sm font-medium mb-3">Informações da Conta</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">
                  {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última Atividade</p>
                <p className="font-medium">
                  {user.last_activity_at 
                    ? format(new Date(user.last_activity_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : '-'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

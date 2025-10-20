import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Globe, 
  Chrome, 
  Code, 
  Plus, 
  Copy, 
  Trash2, 
  Eye,
  EyeOff,
  TrendingUp,
  Check
} from "lucide-react";
import { useExternalSources } from "@/hooks/useExternalSources";
import { CreateIntegrationDialog } from "./CreateIntegrationDialog";
import { IntegrationStatsCard } from "./IntegrationStatsCard";
import { AutoConversionSettings } from "@/components/rank-rent/AutoConversionSettings";
import { toast } from "sonner";
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

interface ExternalSourcesManagerProps {
  userId: string;
}

export const ExternalSourcesManager = ({ userId }: ExternalSourcesManagerProps) => {
  const { sources, isLoading, deleteSource, toggleActive } = useExternalSources(userId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'wordpress': return <Globe className="w-5 h-5" />;
      case 'chrome_extension': return <Chrome className="w-5 h-5" />;
      case 'api': return <Code className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const getSourceLabel = (type: string) => {
    switch (type) {
      case 'wordpress': return 'WordPress';
      case 'chrome_extension': return 'Chrome Extension';
      case 'api': return 'API';
      default: return type;
    }
  };

  const copyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    toast.success('Token copiado!', {
      description: 'Cole no seu plugin/extensão para ativar a integração.',
      icon: <Check className="w-4 h-4" />,
    });
  };

  const toggleTokenVisibility = (id: string) => {
    setShowToken(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteClick = (id: string) => {
    setSourceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (sourceToDelete) {
      deleteSource(sourceToDelete);
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrações Externas</h2>
          <p className="text-muted-foreground">
            Capture leads automaticamente do WordPress, WhatsApp e outras fontes
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      {/* Stats Overview */}
      {sources && sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resumo Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {sources.filter(s => s.is_active).length}
                </div>
                <p className="text-sm text-muted-foreground">Integrações Ativas</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {sources.reduce((acc, s) => acc + (s.stats?.total_leads || 0), 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total de Leads Capturados</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{sources.length}</div>
                <p className="text-sm text-muted-foreground">Total de Integrações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Conversion Settings */}
      <AutoConversionSettings />

      {/* Sources List */}
      {sources && sources.length > 0 ? (
        <div className="grid gap-4">
          {sources.map((source) => (
            <Card key={source.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {getSourceIcon(source.source_type)}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{source.source_name}</h3>
                        <Badge variant={source.is_active ? "default" : "secondary"}>
                          {source.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline">{getSourceLabel(source.source_type)}</Badge>
                      </div>
                      
                      {source.site_url && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {source.site_url}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Leads capturados: </span>
                          <span className="font-medium">{source.stats?.total_leads || 0}</span>
                        </div>
                        {source.stats?.last_lead_at && (
                          <div>
                            <span className="text-muted-foreground">Último lead: </span>
                            <span className="font-medium">
                              {new Date(source.stats.last_lead_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* API Token */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Token da API
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 text-xs bg-muted rounded-md font-mono">
                            {showToken[source.id] ? source.api_token : '•'.repeat(48)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleTokenVisibility(source.id)}
                          >
                            {showToken[source.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToken(source.api_token)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={source.is_active}
                      onCheckedChange={(checked) => 
                        toggleActive({ id: source.id, is_active: checked })
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedSource(source.id)}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(source.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira integração para começar a capturar leads automaticamente
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Integração
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Modal */}
      {selectedSource && (
        <IntegrationStatsCard
          sourceId={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}

      {/* Create Dialog */}
      <CreateIntegrationDialog
        userId={userId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta integração? Os leads já capturados não serão afetados,
              mas novas capturas serão bloqueadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

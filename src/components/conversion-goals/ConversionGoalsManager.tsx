import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Target, 
  MousePointer, 
  FileText, 
  Link as LinkIcon, 
  Layers,
  Trash2,
  Info,
  DollarSign,
  Search,
  Filter,
  X,
  Pencil,
  Megaphone,
  Lock,
  Sparkles
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConversionGoals, ConversionGoal } from '@/hooks/useConversionGoals';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { CreateGoalDialog } from './CreateGoalDialog';
import { EditGoalDialog } from './EditGoalDialog';
import { ConversionGoalsAnalytics } from './ConversionGoalsAnalytics';
import { ConversionGoalsOnboarding, getOnboardingDismissed, setOnboardingDismissed } from './ConversionGoalsOnboarding';
import { AdsIntegrationTab } from './AdsIntegrationTab';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConversionGoalsManagerProps {
  siteId: string;
  siteUrl?: string;
}

const getGoalTypeIcon = (type: string) => {
  switch (type) {
    case 'cta_match':
      return <MousePointer className="h-4 w-4" />;
    case 'page_destination':
      return <FileText className="h-4 w-4" />;
    case 'url_pattern':
      return <LinkIcon className="h-4 w-4" />;
    case 'combined':
      return <Layers className="h-4 w-4" />;
    default:
      return <Target className="h-4 w-4" />;
  }
};

const getGoalTypeLabel = (type: string) => {
  switch (type) {
    case 'cta_match':
      return 'CTA Match';
    case 'page_destination':
      return 'Página Destino';
    case 'url_pattern':
      return 'Padrão URL';
    case 'combined':
      return 'Combinado';
    default:
      return type;
  }
};

const GoalCard = ({ 
  goal, 
  onToggle, 
  onDelete,
  onEdit
}: { 
  goal: ConversionGoal; 
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (goal: ConversionGoal) => void;
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getCriteriaSummary = () => {
    const parts: string[] = [];
    
    if (goal.cta_exact_matches?.length > 0) {
      parts.push(`${goal.cta_exact_matches.length} CTA(s) exato(s)`);
    }
    if (goal.cta_patterns?.length > 0) {
      parts.push(`${goal.cta_patterns.length} padrão(ões) CTA`);
    }
    if (goal.page_urls?.length > 0) {
      parts.push(`${goal.page_urls.length} página(s)`);
    }
    if (goal.url_patterns?.length > 0) {
      parts.push(`${goal.url_patterns.length} padrão(ões) URL`);
    }
    
    return parts.join(' • ') || 'Nenhum critério configurado';
  };

  return (
    <>
      <Card className={`transition-opacity ${!goal.is_active ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${goal.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                {getGoalTypeIcon(goal.goal_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{goal.goal_name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {getGoalTypeLabel(goal.goal_type)}
                  </Badge>
                  {goal.conversion_value > 0 && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <DollarSign className="h-3 w-3" />
                      R$ {goal.conversion_value.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {getCriteriaSummary()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Status Toggle com UI melhorada */}
              <div 
                className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${
                  goal.is_active 
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
                    : 'bg-muted/50 border-border'
                }`}
                onClick={() => onToggle(goal.id, !goal.is_active)}
              >
                <Switch
                  checked={goal.is_active}
                  onCheckedChange={(checked) => onToggle(goal.id, checked)}
                  className={goal.is_active ? 'data-[state=checked]:bg-green-500' : ''}
                />
                <span className={`text-xs font-medium select-none ${
                  goal.is_active ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
                }`}>
                  {goal.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              {/* Botão Editar */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(goal)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              {/* Botão Deletar */}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta de Conversão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{goal.goal_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(goal.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

type GoalTypeFilter = 'all' | 'cta_match' | 'page_destination' | 'url_pattern' | 'combined';
type StatusFilter = 'all' | 'active' | 'inactive';

export const ConversionGoalsManager = ({ siteId, siteUrl }: ConversionGoalsManagerProps) => {
  const { goals, isLoading, toggleGoal, deleteGoal } = useConversionGoals(siteId);
  const { hasAdvancedTracking, isLoading: isLoadingAccess, planName } = useFeatureAccess();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ConversionGoal | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<GoalTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Bloqueio de acesso para planos sem Tracking Avançado
  if (!isLoadingAccess && !hasAdvancedTracking) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Tracking Avançado</h3>
          </div>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Metas de Conversão personalizadas, Export para Google Ads e integração com Meta Conversions API 
            disponíveis a partir do plano Professional.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/settings?tab=subscription">
                Fazer Upgrade
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/#ads-tracking" target="_blank" rel="noopener noreferrer">
                Saiba Mais
              </a>
            </Button>
          </div>
          {planName && (
            <p className="text-xs text-muted-foreground mt-4">
              Seu plano atual: <span className="font-medium">{planName}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Check if should show onboarding on mount
  useEffect(() => {
    if (!isLoading && goals.length === 0 && !getOnboardingDismissed(siteId)) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [isLoading, goals.length, siteId]);
  
  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      // Search by name
      if (searchTerm && !goal.goal_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Filter by type
      if (typeFilter !== 'all' && goal.goal_type !== typeFilter) {
        return false;
      }
      // Filter by status
      if (statusFilter === 'active' && !goal.is_active) return false;
      if (statusFilter === 'inactive' && goal.is_active) return false;
      
      return true;
    });
  }, [goals, searchTerm, typeFilter, statusFilter]);
  
  const hasActiveFilters = searchTerm || typeFilter !== 'all' || statusFilter !== 'all';
  
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleToggle = (id: string, is_active: boolean) => {
    toggleGoal.mutate({ id, is_active });
  };

  const handleDelete = (id: string) => {
    deleteGoal.mutate(id);
  };

  const handleEdit = (goal: ConversionGoal) => {
    setEditingGoal(goal);
    setShowEditDialog(true);
  };

  const handleOnboardingDismiss = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingCreateGoal = () => {
    setShowOnboarding(false);
    setShowCreateDialog(true);
  };

  return (
    <Tabs defaultValue="goals" className="space-y-6">
      <TabsList>
        <TabsTrigger value="goals" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Metas de Conversão
        </TabsTrigger>
        <TabsTrigger value="ads" className="flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          Google & Meta Ads
        </TabsTrigger>
      </TabsList>

      <TabsContent value="goals" className="space-y-6">
        {/* Onboarding - Shows only on first visit with no goals */}
        {showOnboarding && (
          <ConversionGoalsOnboarding
            siteId={siteId}
            onCreateGoal={handleOnboardingCreateGoal}
            onDismiss={handleOnboardingDismiss}
          />
        )}

        {/* Analytics Section - Only shows when goals exist */}
        <ConversionGoalsAnalytics siteId={siteId} />
      
      {/* Goals Manager */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Metas de Conversão
              </CardTitle>
              <CardDescription>
                Defina quais ações contam como conversão para este projeto
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-2">Nenhuma meta configurada</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Sem metas definidas, todos os cliques em botões, WhatsApp, telefone e email serão contados como conversão.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Meta
              </Button>
            </div>
          ) : (
            <>
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar meta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as GoalTypeFilter)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="cta_match">CTA Match</SelectItem>
                    <SelectItem value="page_destination">Página Destino</SelectItem>
                    <SelectItem value="url_pattern">Padrão URL</SelectItem>
                    <SelectItem value="combined">Combinado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="icon" onClick={clearFilters} className="flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Com metas ativas, apenas eventos que correspondam aos critérios configurados serão contados como conversão.
                  Metas desativadas são ignoradas.
                </p>
              </div>
              
              {filteredGoals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma meta encontrada com os filtros aplicados</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>

        <CreateGoalDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          siteId={siteId}
        />

        {editingGoal && (
          <EditGoalDialog
            open={showEditDialog}
            onOpenChange={(open) => {
              setShowEditDialog(open);
              if (!open) setEditingGoal(null);
            }}
            siteId={siteId}
            goal={editingGoal}
          />
        )}
      </Card>
      </TabsContent>

      <TabsContent value="ads">
        <AdsIntegrationTab 
          siteId={siteId}
          siteUrl={siteUrl}
          goals={goals} 
        />
      </TabsContent>
    </Tabs>
  );
};

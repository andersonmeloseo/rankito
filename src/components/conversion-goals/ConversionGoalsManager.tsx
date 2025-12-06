import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Target, 
  MousePointer, 
  FileText, 
  Link, 
  Layers,
  Trash2,
  Info,
  DollarSign
} from 'lucide-react';
import { useConversionGoals, ConversionGoal } from '@/hooks/useConversionGoals';
import { CreateGoalDialog } from './CreateGoalDialog';
import { ConversionGoalsAnalytics } from './ConversionGoalsAnalytics';
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
}

const getGoalTypeIcon = (type: string) => {
  switch (type) {
    case 'cta_match':
      return <MousePointer className="h-4 w-4" />;
    case 'page_destination':
      return <FileText className="h-4 w-4" />;
    case 'url_pattern':
      return <Link className="h-4 w-4" />;
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
  onDelete 
}: { 
  goal: ConversionGoal; 
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      checked={goal.is_active}
                      onCheckedChange={(checked) => onToggle(goal.id, checked)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {goal.is_active ? 'Desativar' : 'Ativar'} meta
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
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

export const ConversionGoalsManager = ({ siteId }: ConversionGoalsManagerProps) => {
  const { goals, isLoading, toggleGoal, deleteGoal } = useConversionGoals(siteId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleToggle = (id: string, is_active: boolean) => {
    toggleGoal.mutate({ id, is_active });
  };

  const handleDelete = (id: string) => {
    deleteGoal.mutate(id);
  };

  return (
    <div className="space-y-6">
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
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Com metas ativas, apenas eventos que correspondam aos critérios configurados serão contados como conversão.
                  Metas desativadas são ignoradas.
                </p>
              </div>
              
              <div className="space-y-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>

        <CreateGoalDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          siteId={siteId}
        />
      </Card>
    </div>
  );
};

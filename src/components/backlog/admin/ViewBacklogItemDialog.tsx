import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BacklogItem } from "@/hooks/useBacklogItems";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Package, Target } from "lucide-react";

interface ViewBacklogItemDialogProps {
  item: BacklogItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels = {
  new_feature: 'Nova Funcionalidade',
  improvement: 'Melhoria',
  bugfix: 'Correção',
  security: 'Segurança',
};

const statusLabels = {
  planned: 'Planejado',
  in_progress: 'Em Progresso',
  testing: 'Teste',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const priorityColors = {
  low: 'bg-gray-500 text-white',
  medium: 'bg-blue-500 text-white',
  high: 'bg-red-500 text-white',
  critical: 'bg-red-700 text-white',
};

const statusColors = {
  planned: 'bg-blue-500 text-white',
  in_progress: 'bg-yellow-500 text-white',
  testing: 'bg-purple-500 text-white',
  completed: 'bg-green-500 text-white',
  cancelled: 'bg-gray-500 text-white',
};

export const ViewBacklogItemDialog = ({ item, open, onOpenChange }: ViewBacklogItemDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.title}</DialogTitle>
          <DialogDescription>
            Detalhes da funcionalidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badges de Status, Categoria e Prioridade */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={`${statusColors[item.status]} border-0`}>
              {statusLabels[item.status]}
            </Badge>
            <Badge className={`${priorityColors[item.priority]} border-0`}>
              {priorityLabels[item.priority]}
            </Badge>
            <Badge variant="outline">
              {categoryLabels[item.category]}
            </Badge>
            {item.is_public && (
              <Badge variant="secondary">Público</Badge>
            )}
          </div>

          {/* Descrição */}
          {item.description && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Descrição</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Progresso */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Progresso</h4>
              <span className="text-sm font-medium">{item.progress_percentage}%</span>
            </div>
            <Progress value={item.progress_percentage} className="h-2" />
          </div>

          {/* Versão de Release */}
          {item.release_version && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Versão Release</p>
                <p className="text-sm font-medium">{item.release_version}</p>
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            {item.estimated_start_date && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Início Previsto</p>
                  <p className="text-sm font-medium">
                    {format(new Date(item.estimated_start_date), 'dd MMM yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {item.estimated_end_date && (
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Conclusão Prevista</p>
                  <p className="text-sm font-medium">
                    {format(new Date(item.estimated_end_date), 'dd MMM yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {item.actual_start_date && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Início Real</p>
                  <p className="text-sm font-medium">
                    {format(new Date(item.actual_start_date), 'dd MMM yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {item.actual_end_date && (
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Conclusão Real</p>
                  <p className="text-sm font-medium">
                    {format(new Date(item.actual_end_date), 'dd MMM yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Sparkles, Wrench, Shield, Bug } from "lucide-react";
import { PublicRoadmapItem } from "@/hooks/usePublicRoadmap";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RoadmapCardProps {
  item: PublicRoadmapItem;
}

const statusColors = {
  planned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  testing: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
};

const statusLabels = {
  planned: 'Planejado',
  in_progress: 'Em Progresso',
  testing: 'Em Teste',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const categoryIcons = {
  new_feature: Sparkles,
  improvement: Wrench,
  bugfix: Bug,
  security: Shield,
};

const categoryLabels = {
  new_feature: 'Nova Feature',
  improvement: 'Melhoria',
  bugfix: 'Correção',
  security: 'Segurança',
};

export const RoadmapCard = ({ item }: RoadmapCardProps) => {
  const CategoryIcon = categoryIcons[item.category];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={statusColors[item.status]}>
            {statusLabels[item.status]}
          </Badge>
          {item.release_version && (
            <Badge variant="outline" className="text-xs">
              {item.release_version}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base line-clamp-2">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs">
          <CategoryIcon className="h-3 w-3" />
          <span className="text-muted-foreground">{categoryLabels[item.category]}</span>
        </div>

        {item.status !== 'completed' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{item.progress_percentage}%</span>
            </div>
            <Progress value={item.progress_percentage} className="h-1.5" />
          </div>
        )}

        {item.estimated_end_date && item.status !== 'completed' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Previsão: {format(new Date(item.estimated_end_date), 'MMM yyyy', { locale: ptBR })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

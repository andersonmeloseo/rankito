import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, ExternalLink, GripVertical, User, Calendar, FileText, Clock, Activity } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Deal } from "@/hooks/useDeals";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDealContext } from "@/hooks/useDealContext";
import { QuickNoteInput } from "./QuickNoteInput";
import { DealBadges } from "./DealBadges";
import { QuickActions } from "./QuickActions";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const getCardColors = (colorValue?: string | null) => {
  const colorMap: Record<string, { bg: string; text: string; textMuted: string }> = {
    default: { 
      bg: "bg-white dark:bg-card", 
      text: "text-foreground",
      textMuted: "text-muted-foreground"
    },
    red: { 
      bg: "bg-red-50 dark:bg-red-950/30", 
      text: "text-red-900 dark:text-red-100",
      textMuted: "text-red-700 dark:text-red-200/70"
    },
    orange: { 
      bg: "bg-orange-50 dark:bg-orange-950/30", 
      text: "text-orange-900 dark:text-orange-100",
      textMuted: "text-orange-700 dark:text-orange-200/70"
    },
    yellow: { 
      bg: "bg-yellow-50 dark:bg-yellow-950/30", 
      text: "text-yellow-900 dark:text-yellow-100",
      textMuted: "text-yellow-700 dark:text-yellow-200/70"
    },
    green: { 
      bg: "bg-green-50 dark:bg-green-950/30", 
      text: "text-green-900 dark:text-green-100",
      textMuted: "text-green-700 dark:text-green-200/70"
    },
    blue: { 
      bg: "bg-blue-50 dark:bg-blue-950/30", 
      text: "text-blue-900 dark:text-blue-100",
      textMuted: "text-blue-700 dark:text-blue-200/70"
    },
    purple: { 
      bg: "bg-purple-50 dark:bg-purple-950/30", 
      text: "text-purple-900 dark:text-purple-100",
      textMuted: "text-purple-700 dark:text-purple-200/70"
    },
    pink: { 
      bg: "bg-pink-50 dark:bg-pink-950/30", 
      text: "text-pink-900 dark:text-pink-100",
      textMuted: "text-pink-700 dark:text-pink-200/70"
    },
    gray: { 
      bg: "bg-gray-50 dark:bg-gray-950/30", 
      text: "text-gray-900 dark:text-gray-100",
      textMuted: "text-gray-700 dark:text-gray-200/70"
    },
  };
  return colorMap[colorValue || "default"] || colorMap.default;
};

interface DealCardProps {
  deal: Deal;
  userId: string;
  onDelete: (id: string) => void;
  onOpenDetails: (deal: Deal) => void;
  onTaskCreated?: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}


export const DealCard = ({ deal, userId, onDelete, onOpenDetails, onTaskCreated, isDragging, dragHandleProps }: DealCardProps) => {
  const cardColors = getCardColors(deal.card_color);
  const { data: context, isLoading, refetch } = useDealContext(deal.id, userId);
  const [showQuickNote, setShowQuickNote] = useState(false);
  
  const handleNoteAdded = () => {
    setShowQuickNote(false);
    refetch();
  };

  const handleTaskCreated = () => {
    refetch();
    onTaskCreated?.();
  };
  
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-200 rounded-xl",
        cardColors.bg,
        !isDragging && "hover:shadow-lg hover:-translate-y-0.5",
        isDragging && "shadow-2xl opacity-90"
      )}
    >
      {/* Drag Handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}
      
      <CardContent 
        className="p-3 space-y-2 cursor-pointer"
        onClick={(e) => {
          if (!isDragging && !showQuickNote) {
            onOpenDetails(deal);
          }
        }}
      >
        {/* Header: Título, Valor e Menu */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-sm font-semibold line-clamp-2 mb-1.5", cardColors.text)}>
              {deal.title}
            </h3>
            <p className="text-xl font-bold text-green-600 dark:text-green-500">
              R$ {deal.value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isDragging}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(deal.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges de Status */}
        <DealBadges deal={deal} context={context} />

        {/* Contadores de Stats */}
        {isLoading ? (
          <div className="flex gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : context && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{context.counts.notes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{context.counts.tasks}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>{context.counts.activities}</span>
            </div>
          </div>
        )}

        <Separator />

        {/* Próxima Tarefa */}
        {context?.nextTask && (
          <div className={cn("text-xs space-y-0.5", cardColors.textMuted)}>
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3 w-3" />
              <span>Próxima: {context.nextTask.title}</span>
            </div>
            <p className="text-xs opacity-70 ml-4.5">
              {format(new Date(context.nextTask.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        )}

        {/* Última Nota (Preview) */}
        {context?.lastNote && !showQuickNote && (
          <div className={cn("text-xs italic line-clamp-2", cardColors.textMuted)}>
            💬 "{context.lastNote.content.substring(0, 60)}
            {context.lastNote.content.length > 60 ? "..." : ""}"
          </div>
        )}

        {/* Quick Note Input */}
        {showQuickNote && (
          <QuickNoteInput
            dealId={deal.id}
            userId={userId}
            onNoteSaved={handleNoteAdded}
            onCancel={() => setShowQuickNote(false)}
          />
        )}

        {/* Quick Actions */}
        {!showQuickNote && (
          <div className="flex justify-between items-center pt-1">
            <QuickActions
              onAddNote={() => setShowQuickNote(true)}
              onAddTask={() => {
                // Abrir dialog de criar tarefa
                onOpenDetails(deal);
              }}
              contactPhone={deal.contact_phone}
              contactEmail={deal.contact_email}
              isDragging={isDragging}
            />
          </div>
        )}

        {/* Tags e Badges */}
        {(deal.target_niche || deal.rank_rent_sites) && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {deal.target_niche && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                  {deal.target_niche}
                </Badge>
              )}
              {deal.rank_rent_sites && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal text-muted-foreground">
                  <ExternalLink className="h-2.5 w-2.5 mr-1" />
                  <span className="truncate">{deal.rank_rent_sites.site_name}</span>
                </Badge>
              )}
            </div>
          </>
        )}

        {/* Informações de Contato */}
        {deal.contact_name && (
          <>
            <Separator />
            <div className={cn("flex items-center gap-1.5 text-xs", cardColors.textMuted)}>
              <User className="h-3 w-3" />
              <span className="font-medium">{deal.contact_name}</span>
            </div>
          </>
        )}

        {/* Data de Fechamento Esperada */}
        {deal.expected_close_date && (
          <div className={cn("flex items-center gap-1.5 text-xs", cardColors.textMuted)}>
            <Calendar className="h-3 w-3" />
            <span>Fechamento: {format(new Date(deal.expected_close_date), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}

        {/* Última Atividade */}
        {context?.lastActivity && (
          <div className="text-xs text-muted-foreground opacity-70">
            Última atividade: {formatDistanceToNow(new Date(context.lastActivity.created_at), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

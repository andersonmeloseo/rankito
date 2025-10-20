import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Phone, Mail, ExternalLink, GripVertical, User, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Deal } from "@/hooks/useDeals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  onDelete: (id: string) => void;
  onOpenDetails: (deal: Deal) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}


export const DealCard = ({ deal, onDelete, onOpenDetails, isDragging, dragHandleProps }: DealCardProps) => {
  const cardColors = getCardColors(deal.card_color);
  
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-200 rounded-xl",
        cardColors.bg,
        !isDragging && "hover:shadow-lg hover:-translate-y-0.5",
        isDragging && "shadow-2xl opacity-90"
      )}
    >
      {/* Drag Handle Invisível */}
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
        className="p-3 space-y-2.5 cursor-pointer"
        onClick={(e) => {
          if (!isDragging) {
            onOpenDetails(deal);
          }
        }}
      >
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

        {deal.description && (
          <p className={cn("text-xs line-clamp-2", cardColors.textMuted)}>{deal.description}</p>
        )}

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

        {deal.contact_name && (
          <div className="space-y-2 pt-2">
            <div className={cn("flex items-center gap-1.5 text-xs", cardColors.textMuted)}>
              <User className="h-3 w-3" />
              <span className="font-medium">{deal.contact_name}</span>
            </div>
            <div className="flex gap-1.5">
              {deal.contact_phone && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild 
                  className="h-7 w-7 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
                  disabled={isDragging}
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={`tel:${deal.contact_phone}`}>
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              {deal.contact_email && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild 
                  className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                  disabled={isDragging}
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={`mailto:${deal.contact_email}`}>
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {deal.expected_close_date && (
          <div className={cn("flex items-center gap-1.5 text-xs pt-2 border-t", cardColors.textMuted)}>
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(deal.expected_close_date), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

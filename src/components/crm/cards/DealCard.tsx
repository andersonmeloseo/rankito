import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Phone, Mail, ExternalLink, GripVertical, User, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Deal } from "@/hooks/useDeals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
  onDelete: (id: string) => void;
  onOpenDetails: (deal: Deal) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const getProbabilityBorderColor = (prob: number) => {
  if (prob >= 75) return "border-l-green-500";
  if (prob >= 50) return "border-l-yellow-500";
  if (prob >= 25) return "border-l-orange-500";
  if (prob > 0) return "border-l-red-500";
  return "border-l-gray-300";
};

export const DealCard = ({ deal, onDelete, onOpenDetails, isDragging, dragHandleProps }: DealCardProps) => {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-200 bg-white dark:bg-card border-l-4 rounded-xl",
        !isDragging && "hover:shadow-lg hover:-translate-y-0.5",
        isDragging && "shadow-2xl opacity-90",
        getProbabilityBorderColor(deal.probability)
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
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1.5">
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
          <p className="text-xs text-muted-foreground/80 line-clamp-2">{deal.description}</p>
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
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(deal.expected_close_date), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

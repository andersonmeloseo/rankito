import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Phone, Mail, ExternalLink, GripVertical, TrendingUp } from "lucide-react";
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

const probabilityBadgeClasses = (prob: number) => {
  if (prob >= 75) return "bg-green-100 text-green-700 border-green-300";
  if (prob >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-300";
  if (prob >= 25) return "bg-orange-100 text-orange-700 border-orange-300";
  return "bg-red-100 text-red-700 border-red-300";
};

export const DealCard = ({ deal, onDelete, onOpenDetails, isDragging, dragHandleProps }: DealCardProps) => {
  return (
    <Card 
      className={`transition-shadow ${!isDragging ? 'hover:shadow-md' : 'shadow-lg'}`}
    >
      {/* Drag Handle Area */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="flex items-center justify-center py-1.5 bg-muted/30 cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors border-b"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      <CardContent 
        className="p-4 space-y-3 cursor-pointer" 
        onClick={(e) => {
          if (!isDragging) {
            onOpenDetails(deal);
          }
        }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-1">{deal.title}</h3>
            <p className="text-2xl font-bold text-primary mt-1">
              R$ {deal.value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                disabled={isDragging}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
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
          <p className="text-sm text-muted-foreground line-clamp-2">{deal.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {deal.probability > 0 && (
            <Badge 
              variant="outline"
              className={cn(
                "font-semibold",
                probabilityBadgeClasses(deal.probability)
              )}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {deal.probability}%
            </Badge>
          )}
          
          {deal.target_niche && (
            <Badge variant="secondary" className="text-xs">
              {deal.target_niche}
            </Badge>
          )}
        </div>

        {deal.rank_rent_sites && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{deal.rank_rent_sites.site_name}</span>
          </div>
        )}

        {deal.contact_name && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-sm font-semibold">{deal.contact_name}</p>
            <div className="flex gap-2">
              {deal.contact_phone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="h-8 flex-1"
                  disabled={isDragging}
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={`tel:${deal.contact_phone}`} className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="text-xs">Ligar</span>
                  </a>
                </Button>
              )}
              {deal.contact_email && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="h-8 flex-1"
                  disabled={isDragging}
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={`mailto:${deal.contact_email}`} className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="text-xs">Email</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {deal.expected_close_date && (
          <p className="text-xs text-muted-foreground">
            Previsão: {format(new Date(deal.expected_close_date), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

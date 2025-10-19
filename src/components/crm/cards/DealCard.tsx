import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Phone, Mail, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Deal } from "@/hooks/useDeals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DealCardProps {
  deal: Deal;
  onDelete: (id: string) => void;
}

const sourceLabels: Record<string, string> = {
  website: "Website",
  referral: "Indicação",
  social: "Redes Sociais",
  cold: "Cold Call",
  other: "Outro",
};

const probabilityColor = (prob: number) => {
  if (prob >= 75) return "text-green-600";
  if (prob >= 50) return "text-yellow-600";
  if (prob >= 25) return "text-orange-600";
  return "text-red-600";
};

export const DealCard = ({ deal, onDelete }: DealCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-1">{deal.title}</h3>
            <p className="text-2xl font-bold text-primary mt-1">
              R$ {deal.value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(deal.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {deal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{deal.description}</p>
        )}

        {deal.rank_rent_sites && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">{deal.rank_rent_sites.site_name}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {deal.source && (
            <Badge variant="outline">{sourceLabels[deal.source] || deal.source}</Badge>
          )}
          {deal.target_niche && (
            <Badge variant="secondary">{deal.target_niche}</Badge>
          )}
          {deal.probability > 0 && (
            <Badge className={probabilityColor(deal.probability)}>
              {deal.probability}%
            </Badge>
          )}
        </div>

        {deal.contact_name && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-sm font-medium">{deal.contact_name}</p>
            <div className="flex gap-2">
              {deal.contact_phone && (
                <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                  <a href={`tel:${deal.contact_phone}`}>
                    <Phone className="h-3 w-3" />
                  </a>
                </Button>
              )}
              {deal.contact_email && (
                <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                  <a href={`mailto:${deal.contact_email}`}>
                    <Mail className="h-3 w-3" />
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

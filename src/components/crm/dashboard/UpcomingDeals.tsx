import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, DollarSign } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Deal } from "@/hooks/useDeals";

interface UpcomingDealsProps {
  deals: Deal[];
}

export const UpcomingDeals = ({ deals }: UpcomingDealsProps) => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const upcomingDeals = deals
    .filter(
      (d) =>
        d.expected_close_date &&
        !["won", "lost"].includes(d.stage) &&
        new Date(d.expected_close_date) <= thirtyDaysFromNow
    )
    .sort(
      (a, b) =>
        new Date(a.expected_close_date!).getTime() -
        new Date(b.expected_close_date!).getTime()
    )
    .slice(0, 10);

  const getDaysUntilClose = (date: string) => {
    return differenceInDays(new Date(date), new Date());
  };

  const getDaysBadgeVariant = (days: number) => {
    if (days < 0) return "destructive";
    if (days <= 7) return "destructive";
    if (days <= 15) return "outline";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deals Fechando em Breve</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {upcomingDeals.length > 0 ? (
              upcomingDeals.map((deal) => {
                const daysUntil = getDaysUntilClose(deal.expected_close_date!);
                
                return (
                  <div
                    key={deal.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer animate-fade-in"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm leading-tight">
                        {deal.title}
                      </h4>
                      <Badge variant={getDaysBadgeVariant(daysUntil)}>
                        {daysUntil < 0
                          ? `${Math.abs(daysUntil)}d atrasado`
                          : daysUntil === 0
                          ? "Hoje"
                          : `${daysUntil}d`}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>R$ {Number(deal.value || 0).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(deal.expected_close_date!), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>

                    {deal.probability !== undefined && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {deal.probability}% probabilidade
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum deal próximo ao fechamento
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

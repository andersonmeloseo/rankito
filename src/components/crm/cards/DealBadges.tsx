import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Mail, Phone, Zap, Moon } from "lucide-react";
import { DealContext } from "@/hooks/useDealContext";
import { Deal } from "@/hooks/useDeals";
import { differenceInDays, isPast, isToday, parseISO } from "date-fns";

interface DealBadgesProps {
  deal: Deal;
  context?: DealContext;
}

export const DealBadges = ({ deal, context }: DealBadgesProps) => {
  const badges: Array<{ icon: React.ReactNode; label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = [];

  // Badge de tarefa vencida ou hoje
  if (context?.nextTask) {
    const taskDate = parseISO(context.nextTask.due_date);
    if (isPast(taskDate) && !isToday(taskDate)) {
      badges.push({
        icon: <AlertCircle className="h-3 w-3" />,
        label: "Atrasado",
        variant: "destructive",
      });
    } else if (isToday(taskDate)) {
      badges.push({
        icon: <Clock className="h-3 w-3" />,
        label: "Hoje",
        variant: "secondary",
      });
    }
  }

  // Badge de follow-up
  if (deal.follow_up_date) {
    const followUpDate = parseISO(deal.follow_up_date);
    const daysUntil = differenceInDays(followUpDate, new Date());
    
    if (daysUntil < 0) {
      badges.push({
        icon: <Zap className="h-3 w-3" />,
        label: "Follow-up vencido",
        variant: "destructive",
      });
    } else if (daysUntil <= 3) {
      badges.push({
        icon: <Zap className="h-3 w-3" />,
        label: `Follow-up em ${daysUntil}d`,
        variant: "secondary",
      });
    }
  }

  // Badge de inatividade (sem atividade nos últimos 7 dias)
  if (context?.lastActivity) {
    const lastActivityDate = parseISO(context.lastActivity.created_at);
    const daysSinceActivity = differenceInDays(new Date(), lastActivityDate);
    
    if (daysSinceActivity > 7) {
      badges.push({
        icon: <Moon className="h-3 w-3" />,
        label: `Inativo (${daysSinceActivity}d)`,
        variant: "outline",
      });
    }
  }

  // Badge de tipo de última atividade recente
  if (context?.lastActivity) {
    const lastActivityDate = parseISO(context.lastActivity.created_at);
    const daysSinceActivity = differenceInDays(new Date(), lastActivityDate);
    
    if (daysSinceActivity <= 1) {
      if (context.lastActivity.activity_type === 'email') {
        badges.push({
          icon: <Mail className="h-3 w-3" />,
          label: "Email enviado",
          variant: "default",
        });
      } else if (context.lastActivity.activity_type === 'call') {
        badges.push({
          icon: <Phone className="h-3 w-3" />,
          label: "Ligação feita",
          variant: "default",
        });
      }
    }
  }

  // Limitar a 2 badges mais relevantes
  const displayBadges = badges.slice(0, 2);

  if (displayBadges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {displayBadges.map((badge, index) => (
        <Badge key={index} variant={badge.variant} className="text-xs px-2 py-0.5 font-normal flex items-center gap-1">
          {badge.icon}
          {badge.label}
        </Badge>
      ))}
    </div>
  );
};

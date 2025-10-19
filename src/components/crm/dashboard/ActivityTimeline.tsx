import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRecentActivities } from "@/hooks/useActivities";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Target,
  CreditCard
} from "lucide-react";

interface ActivityTimelineProps {
  userId: string;
}

export const ActivityTimeline = ({ userId }: ActivityTimelineProps) => {
  const { activities, isLoading } = useRecentActivities(userId, 10);

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: typeof Phone } = {
      call: Phone,
      email: Mail,
      meeting: Calendar,
      whatsapp: MessageSquare,
      note: FileText,
      status_change: TrendingUp,
      deal_created: Target,
      deal_won: CheckCircle2,
      deal_lost: XCircle,
      task_completed: CheckCircle2,
      contract_signed: FileText,
      payment_received: CreditCard,
    };
    return icons[type] || FileText;
  };

  const getActivityColor = (type: string) => {
    const colors: { [key: string]: string } = {
      call: 'text-blue-600 bg-blue-50',
      email: 'text-purple-600 bg-purple-50',
      meeting: 'text-green-600 bg-green-50',
      whatsapp: 'text-emerald-600 bg-emerald-50',
      note: 'text-slate-600 bg-slate-50',
      status_change: 'text-orange-600 bg-orange-50',
      deal_created: 'text-primary bg-primary/10',
      deal_won: 'text-green-600 bg-green-50',
      deal_lost: 'text-red-600 bg-red-50',
      task_completed: 'text-green-600 bg-green-50',
      contract_signed: 'text-indigo-600 bg-indigo-50',
      payment_received: 'text-emerald-600 bg-emerald-50',
    };
    return colors[type] || 'text-slate-600 bg-slate-50';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities && activities.length > 0 ? (
              activities.map((activity) => {
                const Icon = getActivityIcon(activity.activity_type);
                const colorClass = getActivityColor(activity.activity_type);
                
                return (
                  <div key={activity.id} className="flex gap-3 animate-fade-in">
                    <div className={`p-2 rounded-lg h-fit ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma atividade recente
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

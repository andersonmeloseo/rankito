import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, Calendar } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  whatsapp: MessageCircle,
  follow_up: Calendar,
  other: Calendar,
};

const typeLabels = {
  call: "Ligação",
  email: "Email",
  meeting: "Reunião",
  whatsapp: "WhatsApp",
  follow_up: "Follow-up",
  other: "Outro",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  canceled: "bg-gray-100 text-gray-700",
};

const statusLabels = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  canceled: "Cancelada",
};

export const TaskCard = ({ task, onComplete }: TaskCardProps) => {
  const TypeIcon = typeIcons[task.type];
  const dueDate = new Date(task.due_date);
  const isOverdue = isPast(dueDate) && task.status === "pending";

  return (
    <Card className={cn("hover:shadow-md transition-shadow", isOverdue && "border-red-300")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => onComplete(task.id)}
            className="mt-1"
          />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={cn("font-semibold", task.status === "completed" && "line-through text-muted-foreground")}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                )}
              </div>
              <TypeIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={priorityColors[task.priority]}>
                {priorityLabels[task.priority]}
              </Badge>
              <Badge className={statusColors[task.status]}>
                {statusLabels[task.status]}
              </Badge>
              <Badge variant="outline">
                {typeLabels[task.type]}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className={cn("text-sm", isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground")}>
                {format(dueDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {isOverdue && " - Atrasada"}
              </p>
              
              <div className="flex gap-1">
                {task.type === "call" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                {task.type === "email" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                {task.type === "whatsapp" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

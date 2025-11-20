import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTicketById } from "@/hooks/useSupportTickets";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  User,
  Monitor,
  Globe,
} from "lucide-react";

interface TicketInfoDialogProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketInfoDialog({
  ticketId,
  open,
  onOpenChange,
}: TicketInfoDialogProps) {
  const { data: ticket } = useTicketById(ticketId);

  if (!ticket) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "default",
      in_progress: "secondary",
      waiting_user: "outline",
      resolved: "outline",
      closed: "outline",
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      urgent: "destructive",
    };
    return <Badge variant={variants[priority] as any}>{priority}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    return <Badge variant="outline">{category}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Informações do Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subject */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{ticket.subject}</h3>
            <div className="flex gap-2 flex-wrap">
              {getCategoryBadge(ticket.category)}
              {getPriorityBadge(ticket.priority)}
              {getStatusBadge(ticket.status)}
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data de Criação</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Última Atualização</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(ticket.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Categoria</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {ticket.category.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Prioridade</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {ticket.priority}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Admin */}
          {ticket.assigned_to && (
            <>
              <Separator />
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Admin Responsável</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.assigned_to}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          {ticket.metadata && Object.keys(ticket.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Informações do Sistema</p>
                <div className="grid grid-cols-2 gap-4">
                  {(ticket.metadata as any).browser && (
                    <div className="flex items-start gap-2">
                      <Monitor className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Navegador</p>
                        <p className="text-sm">{(ticket.metadata as any).browser}</p>
                      </div>
                    </div>
                  )}
                  {(ticket.metadata as any).os && (
                    <div className="flex items-start gap-2">
                      <Monitor className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sistema</p>
                        <p className="text-sm">{(ticket.metadata as any).os}</p>
                      </div>
                    </div>
                  )}
                  {(ticket.metadata as any).url && (
                    <div className="flex items-start gap-2 col-span-2">
                      <Globe className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">URL de Origem</p>
                        <p className="text-sm truncate">{(ticket.metadata as any).url}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

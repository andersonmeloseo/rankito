import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Deal, useDeals } from "@/hooks/useDeals";
import { useActivities } from "@/hooks/useActivities";
import { useTasks } from "@/hooks/useTasks";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { EditDealDialog } from "./EditDealDialog";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { 
  Edit, 
  Plus, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DealDetailsDialogProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const sourceLabels: Record<string, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
  referral: "Indicação",
  organic: "Orgânico",
  paid: "Pago",
};

const activityIcons: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  whatsapp: Phone,
  note: Edit,
  status_change: TrendingUp,
  deal_created: Plus,
  deal_won: CheckCircle2,
  deal_lost: Circle,
};

export function DealDetailsDialog({ deal, open, onOpenChange, userId }: DealDetailsDialogProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const { updateDeal } = useDeals(userId);
  const { stages } = usePipelineStages(userId);
  const { activities } = useActivities(userId, { dealId: deal?.id });
  const { tasks } = useTasks(userId, { dealId: deal?.id });

  if (!deal) return null;

  const handleStageChange = (newStage: string) => {
    updateDeal({
      id: deal.id,
      updates: { stage: newStage as any },
    });
  };

  const handleTaskComplete = (taskId: string, currentStatus: string) => {
    // This would need a task update mutation in useTasks
    console.log("Toggle task", taskId, currentStatus);
  };

  const probabilityColor = (prob: number) => {
    if (prob >= 75) return "text-green-600";
    if (prob >= 50) return "text-yellow-600";
    if (prob >= 25) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl">{deal.title}</DialogTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    {stages?.find(s => s.stage_key === deal.stage)?.label || deal.stage}
                  </Badge>
                  {deal.source && (
                    <Badge variant="secondary">
                      {sourceLabels[deal.source] || deal.source}
                    </Badge>
                  )}
                  <Badge variant="outline" className={probabilityColor(deal.probability)}>
                    {deal.probability}% probabilidade
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button size="sm" onClick={() => setTaskDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tarefa
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      Mover para...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {stages?.map((stage) => (
                      <DropdownMenuItem 
                        key={stage.id}
                        onClick={() => handleStageChange(stage.stage_key)}
                        disabled={stage.stage_key === deal.stage}
                      >
                        {stage.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-6 mt-4">
            {/* Coluna Principal - Informações */}
            <div className="col-span-2 space-y-4">
              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <DollarSign className="w-4 h-4" />
                    Valor do Deal
                  </div>
                  <div className="text-2xl font-bold">
                    R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                {deal.expected_close_date && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      Fechamento Esperado
                    </div>
                    <div className="text-lg font-semibold">
                      {format(new Date(deal.expected_close_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </div>
                  </div>
                )}
              </div>

              {deal.description && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Descrição</h3>
                    <p className="text-muted-foreground">{deal.description}</p>
                  </div>
                </>
              )}

              {/* Informações de Contato */}
              {(deal.contact_name || deal.contact_email || deal.contact_phone) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold">Informações de Contato</h3>
                    {deal.contact_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Nome:</span>
                        <span className="text-muted-foreground">{deal.contact_name}</span>
                      </div>
                    )}
                    {deal.contact_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${deal.contact_email}`} className="text-primary hover:underline">
                          {deal.contact_email}
                        </a>
                      </div>
                    )}
                    {deal.contact_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4" />
                        <span className="text-muted-foreground">{deal.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Nicho e Localização */}
              {(deal.target_niche || deal.target_location) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {deal.target_niche && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4" />
                        <span className="font-medium">Nicho:</span>
                        <span className="text-muted-foreground">{deal.target_niche}</span>
                      </div>
                    )}
                    {deal.target_location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">Localização:</span>
                        <span className="text-muted-foreground">{deal.target_location}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {deal.stage === 'lost' && deal.lost_reason && (
                <>
                  <Separator />
                  <div className="space-y-2 p-3 bg-destructive/10 rounded-lg">
                    <h3 className="font-semibold text-destructive">Motivo da Perda</h3>
                    <p className="text-sm text-muted-foreground">{deal.lost_reason}</p>
                  </div>
                </>
              )}
            </div>

            {/* Coluna Lateral - Timeline e Tarefas */}
            <div className="space-y-4">
              {/* Tarefas Relacionadas */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Tarefas ({tasks?.length || 0})
                </h3>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {tasks && tasks.length > 0 ? (
                      tasks.map((task) => (
                        <div 
                          key={task.id}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => handleTaskComplete(task.id, task.status)}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma tarefa vinculada
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Timeline de Atividades */}
              <div className="space-y-3">
                <h3 className="font-semibold">Timeline de Atividades</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {activities && activities.length > 0 ? (
                      activities.map((activity) => {
                        const Icon = activityIcons[activity.activity_type] || Circle;
                        return (
                          <div key={activity.id} className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{activity.title}</div>
                              {activity.description && (
                                <div className="text-xs text-muted-foreground">{activity.description}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(activity.created_at), { 
                                  addSuffix: true,
                                  locale: ptBR 
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma atividade registrada
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditDealDialog 
        deal={deal}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userId={userId}
      />

      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        userId={userId}
        initialDealId={deal.id}
      />
    </>
  );
}

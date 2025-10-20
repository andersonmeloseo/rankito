import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface SubscriptionHistoryDialogProps {
  subscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubscriptionHistoryDialog = ({ 
  subscriptionId, 
  open, 
  onOpenChange 
}: SubscriptionHistoryDialogProps) => {
  const { data: history, isLoading } = useSubscriptionHistory(subscriptionId || undefined);

  const actionLabels: Record<string, string> = {
    create: "Criada",
    update: "Atualizada",
    cancel: "Cancelada",
    reactivate: "Reativada",
  };

  const actionColors: Record<string, string> = {
    create: "bg-blue-100 text-blue-800",
    update: "bg-purple-100 text-purple-800",
    cancel: "bg-red-100 text-red-800",
    reactivate: "bg-green-100 text-green-800",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico encontrado
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              {history.map((entry, index) => (
                <div key={entry.id} className="relative pl-12 pb-6">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={actionColors[entry.action] || "bg-gray-100 text-gray-800"}>
                        {actionLabels[entry.action] || entry.action}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    {entry.profiles && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          {entry.profiles.full_name || entry.profiles.email}
                        </span>
                      </div>
                    )}

                    {entry.notes && (
                      <p className="text-sm">{entry.notes}</p>
                    )}

                    {/* Show key changes */}
                    {entry.action === 'update' && entry.old_values && entry.new_values && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Alterações:</p>
                        {Object.keys(entry.new_values).map((key) => {
                          const oldVal = entry.old_values?.[key];
                          const newVal = entry.new_values?.[key];
                          
                          // Skip if values are the same or system fields
                          if (oldVal === newVal || ['id', 'created_at', 'updated_at'].includes(key)) {
                            return null;
                          }

                          return (
                            <div key={key} className="text-xs">
                              <span className="font-medium">{key}:</span>{" "}
                              <span className="text-muted-foreground line-through">
                                {String(oldVal)}
                              </span>{" "}
                              → <span className="text-primary">{String(newVal)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

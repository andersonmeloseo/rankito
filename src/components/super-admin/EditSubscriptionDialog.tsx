import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSubscriptions, UserSubscription } from "@/hooks/useSubscriptions";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditSubscriptionDialogProps {
  subscription: UserSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSubscriptionDialog = ({ 
  subscription, 
  open, 
  onOpenChange 
}: EditSubscriptionDialogProps) => {
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState<"trial" | "active" | "past_due" | "canceled" | "expired">("active");
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [notes, setNotes] = useState("");

  const { updateSubscription } = useSubscriptions();
  const { plans } = useSubscriptionPlans();
  const { data: history } = useSubscriptionHistory(subscription?.id);

  useEffect(() => {
    if (subscription) {
      setPlanId(subscription.plan_id);
      setStatus(subscription.status);
      setPeriodStart(new Date(subscription.current_period_start));
      setPeriodEnd(new Date(subscription.current_period_end));
      setNotes(subscription.notes || "");
    }
  }, [subscription]);

  if (!subscription) return null;

  const handleSave = () => {
    updateSubscription({
      id: subscription.id,
      updates: {
        plan_id: planId,
        status,
        current_period_start: periodStart?.toISOString(),
        current_period_end: periodEnd?.toISOString(),
        notes,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Assinatura - {subscription.profiles?.email}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div>
              <Label>Usuário</Label>
              <p className="text-sm text-muted-foreground">
                {subscription.profiles?.email}
              </p>
            </div>

            <div>
              <Label htmlFor="plan">Plano</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans?.filter(p => p.is_active).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="past_due">Atrasada</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !periodStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodStart ? format(periodStart, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={periodStart}
                      onSelect={setPeriodStart}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data de Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !periodEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodEnd ? format(periodEnd, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={periodEnd}
                      onSelect={setPeriodEnd}
                      locale={ptBR}
                      disabled={(date) => periodStart ? date < periodStart : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre esta assinatura..."
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {!history || history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum histórico encontrado
                </p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">
                        {entry.action === 'create' && 'Criada'}
                        {entry.action === 'update' && 'Atualizada'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    {entry.profiles && (
                      <p className="text-xs text-muted-foreground">
                        Por: {entry.profiles.full_name || entry.profiles.email}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-sm mt-2">{entry.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubscriptions, UserSubscription } from "@/hooks/useSubscriptions";
import { addDays, addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

interface ExtendSubscriptionDialogProps {
  subscription: UserSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExtendSubscriptionDialog = ({ 
  subscription, 
  open, 
  onOpenChange 
}: ExtendSubscriptionDialogProps) => {
  const [days, setDays] = useState<number>(30);
  const [reason, setReason] = useState("");
  const { updateSubscription } = useSubscriptions();

  if (!subscription) return null;

  const currentEnd = new Date(subscription.current_period_end);
  const newEnd = addDays(currentEnd, days);

  const handleExtend = () => {
    updateSubscription({
      id: subscription.id,
      updates: {
        current_period_end: newEnd.toISOString(),
        notes: `Período estendido por ${days} dias. Motivo: ${reason || 'Não especificado'}`,
      },
    });
    onOpenChange(false);
    setDays(30);
    setReason("");
  };

  const quickOptions = [
    { label: "+7 dias", value: 7 },
    { label: "+15 dias", value: 15 },
    { label: "+30 dias", value: 30 },
    { label: "+60 dias", value: 60 },
    { label: "+90 dias", value: 90 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estender Período da Assinatura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Usuário</Label>
            <p className="text-sm text-muted-foreground">
              {subscription.profiles?.email}
            </p>
          </div>

          <div>
            <Label>Plano</Label>
            <p className="text-sm text-muted-foreground">
              {subscription.subscription_plans?.name}
            </p>
          </div>

          <div>
            <Label htmlFor="days">Dias a Adicionar</Label>
            <Input
              id="days"
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 0)}
              min={1}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {quickOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setDays(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Preview:</span>
            </div>
            <div className="text-sm space-y-1 pl-6">
              <div>
                <span className="text-muted-foreground">Data atual de término:</span>{" "}
                <span className="font-medium">
                  {format(currentEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Nova data de término:</span>{" "}
                <span className="font-medium text-primary">
                  {format(newEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Motivo da Extensão</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da extensão..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExtend}>
            Estender Período
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

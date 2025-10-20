import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSubscriptions, UserSubscription } from "@/hooks/useSubscriptions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PauseSubscriptionDialogProps {
  subscription: UserSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PauseSubscriptionDialog = ({ 
  subscription, 
  open, 
  onOpenChange 
}: PauseSubscriptionDialogProps) => {
  const [reason, setReason] = useState("client_request");
  const [resumeDate, setResumeDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const { updateSubscription } = useSubscriptions();

  if (!subscription) return null;

  const handlePause = () => {
    const reasonText = {
      client_request: "Solicitação do cliente",
      vacation: "Férias",
      technical_issues: "Problemas técnicos",
      payment_issues: "Problemas de pagamento",
      other: "Outro motivo"
    }[reason];

    updateSubscription({
      id: subscription.id,
      updates: {
        status: 'past_due', // Using past_due to represent paused
        paused_at: new Date().toISOString(),
        paused_reason: reasonText,
        notes: notes || `Pausada. ${resumeDate ? `Retorno previsto: ${format(resumeDate, 'dd/MM/yyyy')}` : 'Sem data de retorno definida'}`,
      },
    });
    onOpenChange(false);
    setReason("client_request");
    setResumeDate(undefined);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pausar Assinatura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Usuário</Label>
            <p className="text-sm text-muted-foreground">
              {subscription.profiles?.email}
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Motivo da Pausa</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client_request">Solicitação do cliente</SelectItem>
                <SelectItem value="vacation">Férias</SelectItem>
                <SelectItem value="technical_issues">Problemas técnicos</SelectItem>
                <SelectItem value="payment_issues">Problemas de pagamento</SelectItem>
                <SelectItem value="other">Outro motivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data Prevista de Retorno (Opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !resumeDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {resumeDate ? (
                    format(resumeDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={resumeDate}
                  onSelect={setResumeDate}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="notes">Observações Adicionais</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre a pausa..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePause} variant="destructive">
            Pausar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Mail } from 'lucide-react';

interface ScheduleReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  reportConfig: any;
}

export const ScheduleReportDialog = ({
  open,
  onOpenChange,
  siteId,
  reportConfig
}: ScheduleReportDialogProps) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [emailTo, setEmailTo] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!emailTo || !emailTo.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um email válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('scheduled_reports')
        .insert({
          user_id: user.id,
          site_id: siteId,
          report_config: reportConfig,
          frequency,
          email_to: emailTo,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Relatório agendado!",
        description: `Você receberá relatórios ${frequency === 'daily' ? 'diariamente' : frequency === 'weekly' ? 'semanalmente' : 'mensalmente'} no email ${emailTo}.`,
      });

      onOpenChange(false);
      setEmailTo('');
    } catch (error: any) {
      console.error('Error scheduling report:', error);
      toast({
        title: "Erro ao agendar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Envio Automático
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">📅 Diário</SelectItem>
                <SelectItem value="weekly">📆 Semanal</SelectItem>
                <SelectItem value="monthly">🗓️ Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email de Destino</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="cliente@exemplo.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p>
              O relatório será enviado automaticamente para o email informado 
              {frequency === 'daily' && ' todos os dias às 8h.'}
              {frequency === 'weekly' && ' toda segunda-feira às 8h.'}
              {frequency === 'monthly' && ' no dia 1 de cada mês às 8h.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? 'Agendando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

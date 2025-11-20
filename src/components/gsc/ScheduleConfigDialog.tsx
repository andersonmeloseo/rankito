import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, Settings, CheckCircle2 } from "lucide-react";
import { useScheduleConfig, ScheduleConfig } from "@/hooks/useScheduleConfig";
import { format, addHours, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ScheduleConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  editingConfig?: ScheduleConfig | null;
}

export const ScheduleConfigDialog = ({ open, onOpenChange, siteId, editingConfig }: ScheduleConfigDialogProps) => {
  const { createConfig, updateConfig } = useScheduleConfig(siteId);
  
  // Estados locais
  const [scheduleName, setScheduleName] = useState('');
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'custom'>('daily');
  const [specificTime, setSpecificTime] = useState('00:30');
  const [specificDays, setSpecificDays] = useState<number[]>([]);
  const [intervalHours, setIntervalHours] = useState(6);
  const [maxUrlsPerRun, setMaxUrlsPerRun] = useState(200);
  const [distributeAcrossDay, setDistributeAcrossDay] = useState(true);
  const [pauseOnQuotaExceeded, setPauseOnQuotaExceeded] = useState(true);

  // Sync state with editingConfig
  useEffect(() => {
    if (editingConfig) {
      setScheduleName(editingConfig.schedule_name);
      setFrequency(editingConfig.frequency);
      setSpecificTime(editingConfig.specific_time);
      setSpecificDays(editingConfig.specific_days || []);
      setIntervalHours(editingConfig.interval_hours || 6);
      setMaxUrlsPerRun(editingConfig.max_urls_per_run);
      setDistributeAcrossDay(editingConfig.distribute_across_day);
      setPauseOnQuotaExceeded(editingConfig.pause_on_quota_exceeded);
    } else {
      // Reset for new schedule
      setScheduleName('');
      setFrequency('daily');
      setSpecificTime('00:30');
      setSpecificDays([]);
      setIntervalHours(6);
      setMaxUrlsPerRun(200);
      setDistributeAcrossDay(true);
      setPauseOnQuotaExceeded(true);
    }
  }, [editingConfig, open]);

  const weekDays = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
  ];

  const toggleDay = (day: number) => {
    setSpecificDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const calculateNextRuns = (): string[] => {
    const now = new Date();
    const runs: string[] = [];
    
    for (let i = 0; i < 5; i++) {
      let nextRun: Date;
      switch(frequency) {
        case 'hourly':
          nextRun = addHours(now, i + 1);
          break;
        case 'daily':
          nextRun = addDays(now, i + 1);
          const [hours, minutes] = specificTime.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
          break;
        case 'weekly':
          nextRun = addDays(now, (i + 1) * 7);
          break;
        case 'custom':
          nextRun = addHours(now, (i + 1) * intervalHours);
          break;
        default:
          nextRun = now;
      }
      runs.push(format(nextRun, "dd/MM/yyyy HH:mm", { locale: ptBR }));
    }
    
    return runs;
  };

  const handleSave = () => {
    // Validações
    if (!scheduleName.trim()) {
      toast.error('Informe um nome para o agendamento');
      return;
    }

    if (frequency === 'weekly' && specificDays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    const configData = {
      schedule_name: scheduleName,
      enabled: true,
      frequency,
      specific_time: specificTime,
      max_urls_per_run: maxUrlsPerRun,
      distribute_across_day: distributeAcrossDay,
      pause_on_quota_exceeded: pauseOnQuotaExceeded,
      ...(frequency === 'weekly' && { specific_days: specificDays }),
      ...(frequency === 'custom' && { interval_hours: intervalHours }),
    };

    if (editingConfig?.id) {
      updateConfig.mutate({ id: editingConfig.id, config: configData });
    } else {
      createConfig.mutate(configData);
    }

    onOpenChange(false);
  };

  const handleQuickConfig = (freq: 'hourly' | 'daily' | 'weekly') => {
    setFrequency(freq);
    if (freq === 'weekly' && specificDays.length === 0) {
      setSpecificDays([1, 2, 3, 4, 5]); // Segunda a sexta
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {editingConfig ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogDescription>
            Configure como e quando suas URLs serão enviadas ao Google Search Console automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Nome do Agendamento */}
          <div className="space-y-2">
            <Label>Nome do Agendamento *</Label>
            <Input
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              placeholder="Ex: Agendamento Manhã, Estratégia Semanal"
            />
          </div>

          {/* Botões Rápidos */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickConfig('hourly')}
              className={frequency === 'hourly' ? 'border-primary' : ''}
            >
              ⚡ A cada hora
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickConfig('daily')}
              className={frequency === 'daily' ? 'border-primary' : ''}
            >
              📅 1x por dia
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickConfig('weekly')}
              className={frequency === 'weekly' ? 'border-primary' : ''}
            >
              📆 Semanal
            </Button>
          </div>

          {/* Seção 1: Frequência */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Frequência de Execução</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="hourly" id="hourly" />
                  <Label htmlFor="hourly" className="flex-1 cursor-pointer">
                    <div className="font-medium">A cada hora</div>
                    <div className="text-xs text-muted-foreground">Distribui URLs a cada 60 minutos</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="flex-1 cursor-pointer">
                    <div className="font-medium">Diariamente</div>
                    <div className="text-xs text-muted-foreground">1x por dia no horário escolhido</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                    <div className="font-medium">Semanalmente</div>
                    <div className="text-xs text-muted-foreground">Escolher dias da semana</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="flex-1 cursor-pointer">
                    <div className="font-medium">Personalizado</div>
                    <div className="text-xs text-muted-foreground">A cada X horas</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Seção 2: Horário */}
          {(frequency === 'daily' || frequency === 'weekly') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário Preferido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input 
                  type="time" 
                  value={specificTime} 
                  onChange={(e) => setSpecificTime(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Horário local (UTC-3)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Seção 3: Dias da Semana */}
          {frequency === 'weekly' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dias da Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {weekDays.map(day => (
                    <Button
                      key={day.value}
                      variant={specificDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interval para Custom */}
          {frequency === 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Intervalo (horas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Slider
                    value={[intervalHours]}
                    onValueChange={([v]) => setIntervalHours(v)}
                    min={1}
                    max={24}
                    step={1}
                  />
                  <div className="text-center">
                    <Badge variant="secondary">A cada {intervalHours} horas</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 4: Controles Avançados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Controles Avançados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Máximo de URLs por execução: {maxUrlsPerRun}</Label>
                <Slider
                  value={[maxUrlsPerRun]}
                  onValueChange={([v]) => setMaxUrlsPerRun(v)}
                  min={50}
                  max={500}
                  step={50}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label>Distribuir URLs ao longo do dia</Label>
                  <p className="text-xs text-muted-foreground">Divide URLs em 48 slots de 30 min</p>
                </div>
                <Switch
                  checked={distributeAcrossDay}
                  onCheckedChange={setDistributeAcrossDay}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label>Pausar quando quota exceder</Label>
                  <p className="text-xs text-muted-foreground">Pausa automaticamente se quota diária for excedida</p>
                </div>
                <Switch
                  checked={pauseOnQuotaExceeded}
                  onCheckedChange={setPauseOnQuotaExceeded}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção 5: Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Próximas Execuções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {calculateNextRuns().map((run, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{run}</span>
                    {i === 0 && <Badge variant="secondary" className="ml-auto">Próxima</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createConfig.isPending || updateConfig.isPending}>
              {(createConfig.isPending || updateConfig.isPending) ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Calendar, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GSCBatchIndexingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUrls: { url: string; page_id?: string }[];
  remainingQuota: number;
  onConfirm: (distribution: 'fast' | 'even') => void;
  isSubmitting: boolean;
}

export const GSCBatchIndexingDialog = ({
  open,
  onOpenChange,
  selectedUrls,
  remainingQuota,
  onConfirm,
  isSubmitting,
}: GSCBatchIndexingDialogProps) => {
  const [distribution, setDistribution] = useState<'fast' | 'even'>('even');

  const totalUrls = selectedUrls.length;
  const urlsToday = distribution === 'fast' 
    ? Math.min(totalUrls, remainingQuota)
    : Math.min(200, remainingQuota, totalUrls);
  
  const daysNeeded = Math.ceil(totalUrls / 200);
  const urlsPerDay = distribution === 'even' ? Math.min(200, Math.ceil(totalUrls / daysNeeded)) : 0;

  const handleConfirm = () => {
    onConfirm(distribution);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Indexar URLs em Lote</DialogTitle>
          <DialogDescription>
            Configure como deseja distribuir a indexação de {totalUrls} URLs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">URLs Selecionadas</div>
              <div className="mt-1 text-2xl font-bold">{totalUrls}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Quota Disponível Hoje</div>
              <div className="mt-1 text-2xl font-bold">{remainingQuota}/200</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Dias Necessários</div>
              <div className="mt-1 text-2xl font-bold">{daysNeeded}</div>
            </div>
          </div>

          {/* Opções de Distribuição */}
          <RadioGroup value={distribution} onValueChange={(value) => setDistribution(value as 'fast' | 'even')}>
            <div className="space-y-3">
              {/* Opção: Distribuir Uniformemente */}
              <Label
                htmlFor="even"
                className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <RadioGroupItem value="even" id="even" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">Distribuir Uniformemente</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Recomendado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Indexar até {urlsPerDay} URLs por dia, distribuindo igualmente ao longo de {daysNeeded} dias.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    📅 Previsão: {urlsToday} hoje, {Math.max(0, totalUrls - urlsToday)} nos próximos {daysNeeded - 1} dias
                  </div>
                </div>
              </Label>

              {/* Opção: Indexar Rápido */}
              <Label
                htmlFor="fast"
                className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <RadioGroupItem value="fast" id="fast" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Indexar o Mais Rápido Possível</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usar toda a quota disponível hoje ({remainingQuota} URLs). O restante será agendado para amanhã.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    ⚡ Previsão: {urlsToday} hoje, {Math.max(0, totalUrls - urlsToday)} amanhã
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Alertas */}
          {totalUrls > remainingQuota && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você selecionou {totalUrls} URLs, mas tem apenas {remainingQuota} de quota disponível hoje.
                {distribution === 'fast' 
                  ? ` ${totalUrls - remainingQuota} URLs serão indexadas amanhã.`
                  : ` A indexação será distribuída ao longo de ${daysNeeded} dias.`
                }
              </AlertDescription>
            </Alert>
          )}

          {remainingQuota === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sua quota diária foi esgotada. Todas as URLs serão agendadas para amanhã.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Adicionando à fila..." : "Confirmar e Adicionar à Fila"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

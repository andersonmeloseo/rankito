import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAggregatedGSCQuota } from '@/hooks/useAggregatedGSCQuota';
import { cn } from '@/lib/utils';

interface GSCManualDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: Array<{ url: string; page_id?: string }>;
  siteId: string;
  onConfirm: (distribution: Record<string, number>) => void;
}

type DistributionMode = 'uniform' | 'manual';

export function GSCManualDistributionDialog({
  open,
  onOpenChange,
  urls,
  siteId,
  onConfirm,
}: GSCManualDistributionDialogProps) {
  const { data: quota, isLoading } = useAggregatedGSCQuota({ siteId });
  const [mode, setMode] = useState<DistributionMode>('uniform');
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, boolean>>({});
  const [manualDistribution, setManualDistribution] = useState<Record<string, number>>({});
  
  const totalUrls = urls.length;
  
  // Filtrar apenas contas saudáveis com capacidade disponível
  const availableAccounts = (quota?.breakdown || []).filter(
    acc => (acc.health_status === 'healthy' || !acc.health_status) && acc.remaining > 0
  );

  // Inicializar seleção de contas (todas saudáveis selecionadas por padrão)
  useEffect(() => {
    if (availableAccounts.length > 0 && Object.keys(selectedAccounts).length === 0) {
      const initial: Record<string, boolean> = {};
      availableAccounts.forEach(acc => {
        initial[acc.integration_id] = true;
      });
      setSelectedAccounts(initial);
    }
  }, [availableAccounts, selectedAccounts]);

  // Calcular distribuição uniforme quando modo uniforme está ativo
  useEffect(() => {
    if (mode === 'uniform') {
      const selected = Object.entries(selectedAccounts)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      
      if (selected.length > 0) {
        const urlsPerAccount = Math.floor(totalUrls / selected.length);
        const remainder = totalUrls % selected.length;
        
        const distribution: Record<string, number> = {};
        selected.forEach((id, index) => {
          // Distribuir o resto nos primeiros accounts
          distribution[id] = urlsPerAccount + (index < remainder ? 1 : 0);
        });
        
        setManualDistribution(distribution);
      }
    }
  }, [mode, selectedAccounts, totalUrls]);

  const toggleAccount = (integrationId: string) => {
    setSelectedAccounts(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId],
    }));
    
    // Se desmarcar no modo manual, zerar a distribuição
    if (mode === 'manual' && selectedAccounts[integrationId]) {
      setManualDistribution(prev => ({
        ...prev,
        [integrationId]: 0,
      }));
    }
  };

  const handleManualChange = (integrationId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setManualDistribution(prev => ({
      ...prev,
      [integrationId]: numValue,
    }));
  };

  // Calcular totais e validações
  const totalDistributed = Object.values(manualDistribution).reduce((sum, val) => sum + val, 0);
  const selectedCount = Object.values(selectedAccounts).filter(Boolean).length;
  
  const isValid = totalDistributed === totalUrls && selectedCount > 0;
  const hasOverCapacity = availableAccounts.some(acc => {
    const assigned = manualDistribution[acc.integration_id] || 0;
    return selectedAccounts[acc.integration_id] && assigned > acc.remaining;
  });

  const handleConfirm = () => {
    if (isValid && !hasOverCapacity) {
      // Filtrar apenas contas selecionadas com URLs > 0
      const finalDistribution: Record<string, number> = {};
      Object.entries(manualDistribution).forEach(([id, count]) => {
        if (selectedAccounts[id] && count > 0) {
          finalDistribution[id] = count;
        }
      });
      
      onConfirm(finalDistribution);
      onOpenChange(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Distribuir {totalUrls} URLs</DialogTitle>
          <DialogDescription>
            Escolha quais contas usar e como distribuir as URLs entre elas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Modo de Distribuição */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Modo de Distribuição</Label>
            <div className="flex gap-2">
              <Button
                variant={mode === 'uniform' ? 'default' : 'outline'}
                onClick={() => setMode('uniform')}
                className="flex-1"
              >
                Uniforme
              </Button>
              <Button
                variant={mode === 'manual' ? 'default' : 'outline'}
                onClick={() => setMode('manual')}
                className="flex-1"
              >
                Manual
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {mode === 'uniform' 
                ? 'Divide automaticamente de forma igual entre as contas selecionadas'
                : 'Você escolhe quantas URLs vai para cada conta'}
            </p>
          </div>

          {/* Lista de Contas */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Contas Disponíveis ({availableAccounts.length})
            </Label>
            
            {availableAccounts.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma conta disponível com capacidade. Todas as contas atingiram o limite diário.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3 border rounded-lg p-4">
                {availableAccounts.map(account => {
                  const isSelected = selectedAccounts[account.integration_id];
                  const assigned = manualDistribution[account.integration_id] || 0;
                  const overCapacity = assigned > account.remaining;
                  
                  return (
                    <div
                      key={account.integration_id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-md border transition-colors",
                        isSelected ? "bg-accent/50 border-primary" : "bg-background border-border"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleAccount(account.integration_id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-muted-foreground">{account.email}</p>
                          </div>
                          <Badge variant="outline">
                            {account.used}/{account.limit} usadas hoje
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{account.remaining} URLs</span> disponíveis
                        </div>
                        
                        {/* Input Manual */}
                        {mode === 'manual' && isSelected && (
                          <div className="pt-2">
                            <Label htmlFor={`input-${account.integration_id}`} className="text-sm">
                              Quantidade de URLs
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                id={`input-${account.integration_id}`}
                                type="number"
                                min="0"
                                max={account.remaining}
                                value={assigned}
                                onChange={(e) => handleManualChange(account.integration_id, e.target.value)}
                                className={cn(
                                  "w-32",
                                  overCapacity && "border-destructive focus-visible:ring-destructive"
                                )}
                              />
                              {overCapacity && (
                                <span className="text-sm text-destructive font-medium">
                                  Excede capacidade!
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Preview Uniforme */}
                        {mode === 'uniform' && isSelected && assigned > 0 && (
                          <div className="pt-2 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              {assigned} URLs serão enviadas
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold">Resumo da Distribuição</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total a distribuir:</span>
                <span className="ml-2 font-medium">{totalUrls} URLs</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total distribuído:</span>
                <span className={cn(
                  "ml-2 font-medium",
                  totalDistributed === totalUrls ? "text-green-600" : "text-orange-600"
                )}>
                  {totalDistributed} URLs
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Contas selecionadas:</span>
                <span className="ml-2 font-medium">{selectedCount} de {availableAccounts.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Capacidade total:</span>
                <span className="ml-2 font-medium">
                  {availableAccounts
                    .filter(acc => selectedAccounts[acc.integration_id])
                    .reduce((sum, acc) => sum + acc.remaining, 0)} URLs
                </span>
              </div>
            </div>
          </div>

          {/* Alertas de Validação */}
          {!isValid && selectedCount > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {totalDistributed < totalUrls 
                  ? `Faltam ${totalUrls - totalDistributed} URLs para distribuir`
                  : `Excesso de ${totalDistributed - totalUrls} URLs na distribuição`}
              </AlertDescription>
            </Alert>
          )}
          
          {hasOverCapacity && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Uma ou mais contas tem URLs atribuídas além da capacidade disponível
              </AlertDescription>
            </Alert>
          )}

          {isValid && !hasOverCapacity && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Distribuição válida! Pronto para enviar.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isValid || hasOverCapacity || selectedCount === 0}
          >
            Distribuir URLs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

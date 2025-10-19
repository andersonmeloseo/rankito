import { useState, useEffect } from 'react';
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
import { Currency, ReportLocale, currencySymbols } from '@/i18n/reportTranslations';
import { DollarSign } from 'lucide-react';

interface ReportFinancialConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: {
    costPerConversion: number;
    currency: Currency;
    locale: ReportLocale;
  }) => void;
}

export const ReportFinancialConfig = ({
  open,
  onOpenChange,
  onSave
}: ReportFinancialConfigProps) => {
  const [costPerConversion, setCostPerConversion] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [locale, setLocale] = useState<ReportLocale>('pt-BR');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('reportFinancialConfig');
    if (saved) {
      const config = JSON.parse(saved);
      setCostPerConversion(config.costPerConversion?.toString() || '');
      setCurrency(config.currency || 'BRL');
      setLocale(config.locale || 'pt-BR');
    }
  }, []);

  const handleSave = () => {
    const cost = parseFloat(costPerConversion);
    if (isNaN(cost) || cost <= 0) {
      alert('Por favor, informe um custo válido por conversão');
      return;
    }

    const config = {
      costPerConversion: cost,
      currency,
      locale
    };

    // Save to localStorage
    localStorage.setItem('reportFinancialConfig', JSON.stringify(config));
    
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configuração Financeira
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cost">
              Custo por Conversão {currencySymbols[currency]}
            </Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 10.00"
              value={costPerConversion}
              onChange={(e) => setCostPerConversion(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Quanto você economiza ou gera de valor por cada conversão?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">🇧🇷 Real Brasileiro (R$)</SelectItem>
                <SelectItem value="USD">🇺🇸 Dólar Americano ($)</SelectItem>
                <SelectItem value="EUR">🇪🇺 Euro (€)</SelectItem>
                <SelectItem value="GBP">🇬🇧 Libra Esterlina (£)</SelectItem>
                <SelectItem value="MXN">🇲🇽 Peso Mexicano ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Idioma do Relatório</Label>
            <Select value={locale} onValueChange={(v) => setLocale(v as ReportLocale)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">🇧🇷 Português</SelectItem>
                <SelectItem value="en-US">🇺🇸 English</SelectItem>
                <SelectItem value="es-ES">🇪🇸 Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

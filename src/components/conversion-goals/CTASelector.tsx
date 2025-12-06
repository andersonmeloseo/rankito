import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MousePointer, Phone, MessageCircle, Mail, X } from 'lucide-react';
import { useDetectedCTAs, DetectedCTA } from '@/hooks/useDetectedCTAs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CTASelectorProps {
  siteId: string;
  selectedCTAs: string[];
  onSelectionChange: (ctas: string[]) => void;
  manualCTAs: string[];
  onManualCTAsChange: (ctas: string[]) => void;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'whatsapp_click':
      return <MessageCircle className="h-3 w-3 text-green-500" />;
    case 'phone_click':
      return <Phone className="h-3 w-3 text-blue-500" />;
    case 'email_click':
      return <Mail className="h-3 w-3 text-orange-500" />;
    default:
      return <MousePointer className="h-3 w-3 text-muted-foreground" />;
  }
};

const getEventLabel = (eventType: string) => {
  switch (eventType) {
    case 'whatsapp_click':
      return 'WhatsApp';
    case 'phone_click':
      return 'Telefone';
    case 'email_click':
      return 'Email';
    case 'button_click':
      return 'Botão';
    case 'form_submit':
      return 'Formulário';
    default:
      return eventType;
  }
};

export const CTASelector = ({
  siteId,
  selectedCTAs,
  onSelectionChange,
  manualCTAs,
  onManualCTAsChange,
}: CTASelectorProps) => {
  const { data: detectedCTAs, isLoading } = useDetectedCTAs(siteId);
  const [manualInput, setManualInput] = useState('');

  const handleCTAToggle = (ctaText: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedCTAs, ctaText]);
    } else {
      onSelectionChange(selectedCTAs.filter(c => c !== ctaText));
    }
  };

  const handleAddManualCTA = () => {
    const trimmed = manualInput.trim();
    if (trimmed && !manualCTAs.includes(trimmed)) {
      onManualCTAsChange([...manualCTAs, trimmed]);
      setManualInput('');
    }
  };

  const handleRemoveManualCTA = (cta: string) => {
    onManualCTAsChange(manualCTAs.filter(c => c !== cta));
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Detected CTAs */}
      {detectedCTAs && detectedCTAs.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">CTAs Detectados Automaticamente</label>
          <ScrollArea className="h-[200px] border rounded-md p-2">
            <div className="space-y-2">
              {detectedCTAs.map((cta: DetectedCTA, index: number) => (
                <div
                  key={`${cta.cta_text}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`cta-${index}`}
                    checked={selectedCTAs.includes(cta.cta_text)}
                    onCheckedChange={(checked) => handleCTAToggle(cta.cta_text, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getEventIcon(cta.event_type)}
                      <span className="text-sm font-medium truncate">{cta.cta_text}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {cta.click_count} cliques
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getEventLabel(cta.event_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Último: {format(new Date(cta.last_seen), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="text-center py-6 border rounded-md bg-muted/20">
          <MousePointer className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum CTA detectado ainda. Os CTAs aparecerão aqui conforme os visitantes interagirem com seu site.
          </p>
        </div>
      )}

      {/* Manual CTAs */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Adicionar CTA Manualmente</label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Solicitar Orçamento"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddManualCTA();
              }
            }}
          />
          <Button type="button" onClick={handleAddManualCTA} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {manualCTAs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {manualCTAs.map((cta, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {cta}
                <button
                  type="button"
                  onClick={() => handleRemoveManualCTA(cta)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {(selectedCTAs.length > 0 || manualCTAs.length > 0) && (
        <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {selectedCTAs.length + manualCTAs.length} CTA(s)
            </span>{' '}
            selecionado(s) para esta meta de conversão
          </p>
        </div>
      )}
    </div>
  );
};

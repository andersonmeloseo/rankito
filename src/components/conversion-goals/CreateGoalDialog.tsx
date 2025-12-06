import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { CTASelector } from './CTASelector';
import { useConversionGoals, CreateGoalInput, GoalType } from '@/hooks/useConversionGoals';
import { MousePointer, FileText, Link, Layers, Loader2, ArrowDown, Clock } from 'lucide-react';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
}

export const CreateGoalDialog = ({ open, onOpenChange, siteId }: CreateGoalDialogProps) => {
  const { createGoal } = useConversionGoals(siteId);
  
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('cta_match');
  const [conversionValue, setConversionValue] = useState('');
  
  // CTA fields
  const [selectedCTAs, setSelectedCTAs] = useState<string[]>([]);
  const [manualCTAs, setManualCTAs] = useState<string[]>([]);
  const [ctaPatterns, setCtaPatterns] = useState('');
  
  // Page destination fields
  const [pageUrls, setPageUrls] = useState('');
  
  // URL pattern fields
  const [urlPatterns, setUrlPatterns] = useState('');

  // Scroll depth fields
  const [minScrollDepth, setMinScrollDepth] = useState<number>(75);

  // Time on page fields
  const [minTimeSeconds, setMinTimeSeconds] = useState<number>(60);

  const handleSubmit = async () => {
    if (!goalName.trim()) return;

    const input: CreateGoalInput = {
      site_id: siteId,
      goal_name: goalName.trim(),
      goal_type: goalType,
      conversion_value: conversionValue ? parseFloat(conversionValue) : 0,
    };

    // Build arrays based on goal type
    if (goalType === 'cta_match' || goalType === 'combined') {
      input.cta_exact_matches = [...selectedCTAs, ...manualCTAs];
      input.cta_patterns = ctaPatterns
        .split('\n')
        .map(p => p.trim())
        .filter(Boolean);
    }

    if (goalType === 'page_destination' || goalType === 'combined') {
      input.page_urls = pageUrls
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);
    }

    if (goalType === 'url_pattern' || goalType === 'combined') {
      input.url_patterns = urlPatterns
        .split('\n')
        .map(p => p.trim())
        .filter(Boolean);
    }

    if (goalType === 'scroll_depth') {
      input.min_scroll_depth = minScrollDepth;
    }

    if (goalType === 'time_on_page') {
      input.min_time_seconds = minTimeSeconds;
    }

    await createGoal.mutateAsync(input);
    
    // Reset form
    setGoalName('');
    setGoalType('cta_match');
    setConversionValue('');
    setSelectedCTAs([]);
    setManualCTAs([]);
    setCtaPatterns('');
    setPageUrls('');
    setUrlPatterns('');
    setMinScrollDepth(75);
    setMinTimeSeconds(60);
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Meta de Conversão</DialogTitle>
          <DialogDescription>
            Defina quando um evento deve ser contado como conversão. Você pode selecionar CTAs detectados
            automaticamente ou configurar regras personalizadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nome da Meta *</Label>
            <Input
              id="goal-name"
              placeholder="Ex: Lead Qualificado, Orçamento Solicitado"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
            />
          </div>

          {/* Goal Type Tabs */}
          <Tabs value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="cta_match" className="flex items-center gap-1">
                <MousePointer className="h-3 w-3" />
                <span className="hidden sm:inline">CTA</span>
              </TabsTrigger>
              <TabsTrigger value="page_destination" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span className="hidden sm:inline">Página</span>
              </TabsTrigger>
              <TabsTrigger value="url_pattern" className="flex items-center gap-1">
                <Link className="h-3 w-3" />
                <span className="hidden sm:inline">URL</span>
              </TabsTrigger>
              <TabsTrigger value="scroll_depth" className="flex items-center gap-1">
                <ArrowDown className="h-3 w-3" />
                <span className="hidden sm:inline">Scroll</span>
              </TabsTrigger>
              <TabsTrigger value="time_on_page" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="hidden sm:inline">Tempo</span>
              </TabsTrigger>
              <TabsTrigger value="combined" className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span className="hidden sm:inline">Combo</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cta_match" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Conversão quando o visitante clicar em um CTA específico.
              </p>
              <CTASelector
                siteId={siteId}
                selectedCTAs={selectedCTAs}
                onSelectionChange={setSelectedCTAs}
                manualCTAs={manualCTAs}
                onManualCTAsChange={setManualCTAs}
              />
              <div className="space-y-2">
                <Label>Padrões de Texto (match parcial)</Label>
                <Textarea
                  placeholder="Orçamento&#10;WhatsApp&#10;Contato"
                  value={ctaPatterns}
                  onChange={(e) => setCtaPatterns(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Um padrão por linha. Ex: "Orçamento" detectará "Solicitar Orçamento", "Pedir Orçamento", etc.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="page_destination" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Conversão quando o visitante chegar em uma página específica (ex: página de obrigado).
              </p>
              <div className="space-y-2">
                <Label>URLs de Destino</Label>
                <Textarea
                  placeholder="/obrigado&#10;/confirmacao&#10;/sucesso"
                  value={pageUrls}
                  onChange={(e) => setPageUrls(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Uma URL por linha. Pode ser path relativo (/obrigado) ou URL completa.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="url_pattern" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Conversão quando o visitante clicar em um link com padrão específico na URL de destino.
              </p>
              <div className="space-y-2">
                <Label>Padrões de URL</Label>
                <Textarea
                  placeholder="wa.me&#10;api.whatsapp.com&#10;tel:"
                  value={urlPatterns}
                  onChange={(e) => setUrlPatterns(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Um padrão por linha. Detecta cliques em links que contenham esse texto.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="scroll_depth" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Conversão quando o visitante rolar a página até uma determinada profundidade. Identifica usuários que leram o conteúdo completo.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Profundidade Mínima de Scroll</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[minScrollDepth]}
                      onValueChange={(v) => setMinScrollDepth(v[0])}
                      min={25}
                      max={100}
                      step={25}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold w-16 text-right">{minScrollDepth}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={minScrollDepth === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMinScrollDepth(value)}
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>25%:</strong> Início da página | <strong>50%:</strong> Metade | <strong>75%:</strong> Maior parte | <strong>100%:</strong> Final completo
                </p>
              </div>
            </TabsContent>

            <TabsContent value="time_on_page" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Conversão quando o visitante permanecer na página por um tempo mínimo. Identifica usuários engajados com o conteúdo.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tempo Mínimo na Página (segundos)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={10}
                      max={600}
                      value={minTimeSeconds}
                      onChange={(e) => setMinTimeSeconds(parseInt(e.target.value) || 60)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      = {Math.floor(minTimeSeconds / 60)}m {minTimeSeconds % 60}s
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 120, 180].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={minTimeSeconds === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMinTimeSeconds(value)}
                    >
                      {value >= 60 ? `${value / 60}min` : `${value}s`}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempo recomendado: 60-120 segundos para artigos, 30-60 segundos para landing pages.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="combined" className="space-y-6 mt-4">
              <p className="text-sm text-muted-foreground">
                Combine múltiplos critérios. A conversão será contada se QUALQUER uma das condições for atendida.
              </p>
              
              {/* CTAs Section */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <MousePointer className="h-4 w-4" /> CTAs
                </h4>
                <CTASelector
                  siteId={siteId}
                  selectedCTAs={selectedCTAs}
                  onSelectionChange={setSelectedCTAs}
                  manualCTAs={manualCTAs}
                  onManualCTAsChange={setManualCTAs}
                />
              </div>

              {/* Pages Section */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Páginas de Destino
                </h4>
                <Textarea
                  placeholder="/obrigado&#10;/confirmacao"
                  value={pageUrls}
                  onChange={(e) => setPageUrls(e.target.value)}
                  rows={2}
                />
              </div>

              {/* URL Patterns Section */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <Link className="h-4 w-4" /> Padrões de URL
                </h4>
                <Textarea
                  placeholder="wa.me&#10;tel:"
                  value={urlPatterns}
                  onChange={(e) => setUrlPatterns(e.target.value)}
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Conversion Value */}
          <div className="space-y-2">
            <Label htmlFor="conversion-value">Valor da Conversão (R$)</Label>
            <Input
              id="conversion-value"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={conversionValue}
              onChange={(e) => setConversionValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Valor monetário atribuído a cada conversão desta meta (opcional).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!goalName.trim() || createGoal.isPending}
          >
            {createGoal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Meta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
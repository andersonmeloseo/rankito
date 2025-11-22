import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Home, FileText, Phone, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FunnelStep {
  url: string;
  sessions: number;
  retentionRate: number;
  dropOffRate: number;
  dropOffCount: number;
  isEntry: boolean;
  isExit: boolean;
}

interface JourneyConversionFunnelProps {
  sequence: string[];
  stepVolumes: Map<string, number>;
  totalSessions: number;
}

export const JourneyConversionFunnel = ({ 
  sequence, 
  stepVolumes, 
  totalSessions 
}: JourneyConversionFunnelProps) => {
  
  // Calculate funnel steps with drop-off rates
  const funnelSteps: FunnelStep[] = sequence.map((url, index) => {
    const sessions = stepVolumes.get(url) || 0;
    const previousSessions = index > 0 ? (stepVolumes.get(sequence[index - 1]) || 0) : totalSessions;
    const retentionRate = previousSessions > 0 ? (sessions / previousSessions) * 100 : 0;
    const dropOffRate = 100 - retentionRate;
    const dropOffCount = previousSessions - sessions;
    
    return {
      url,
      sessions,
      retentionRate: index === 0 ? 100 : retentionRate,
      dropOffRate: index === 0 ? 0 : dropOffRate,
      dropOffCount: index === 0 ? 0 : dropOffCount,
      isEntry: index === 0,
      isExit: index === sequence.length - 1
    };
  });

  // Find the step with the highest drop-off
  const maxDropOff = funnelSteps.reduce((max, step) => 
    step.dropOffRate > max ? step.dropOffRate : max, 0
  );

  const getStepIcon = (url: string, isEntry: boolean, isExit: boolean) => {
    if (isEntry) return <Home className="w-4 h-4" />;
    if (isExit) return <CheckCircle className="w-4 h-4" />;
    if (url.includes('contact') || url.includes('contato')) return <Phone className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStepColor = (step: FunnelStep) => {
    if (step.isEntry) return "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400";
    if (step.dropOffRate >= 30) return "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-400";
    if (step.dropOffRate >= 15) return "bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-400";
    return "bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-400";
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname === '/' ? 'Home' : urlObj.pathname;
    } catch {
      return url;
    }
  };

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" />
          Funil de Conversão - Jornada
          <Badge variant="secondary" className="ml-auto">
            {funnelSteps[0]?.sessions.toLocaleString()} sessões iniciais
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {funnelSteps.map((step, index) => (
          <div key={step.url} className="space-y-2">
            {/* Step Card */}
            <div 
              className={`relative border-2 rounded-lg p-4 transition-all ${getStepColor(step)}`}
              style={{ 
                width: `${Math.max(30, step.retentionRate)}%`,
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStepIcon(step.url, step.isEntry, step.isExit)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">
                      {formatUrl(step.url)}
                    </div>
                    <div className="text-xs opacity-80 truncate">
                      {step.url}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {step.sessions.toLocaleString()}
                  </div>
                  <div className="text-xs opacity-80">
                    {step.retentionRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Critical drop-off badge */}
              {step.dropOffRate === maxDropOff && step.dropOffRate >= 20 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 animate-pulse"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Maior Perda
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold">⚠️ Maior Ponto de Abandono</p>
                        <p>{step.dropOffCount.toLocaleString()} sessões abandonaram aqui ({step.dropOffRate.toFixed(1)}% do total)</p>
                        <div className="text-xs space-y-1 mt-2 opacity-90">
                          <p><strong>Sugestões:</strong></p>
                          <p>• Revisar conteúdo desta página</p>
                          <p>• Verificar tempo de carregamento</p>
                          <p>• Adicionar CTAs mais claros</p>
                          <p>• Analisar cliques e interações</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Drop-off indicator */}
            {index < funnelSteps.length - 1 && (
              <div className="text-center text-sm py-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                  step.dropOffRate >= 30 
                    ? 'bg-red-500/10 text-red-700 dark:text-red-400' 
                    : step.dropOffRate >= 15
                    ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <TrendingDown className="w-3 h-3" />
                  {funnelSteps[index + 1].dropOffRate.toFixed(1)}% abandonaram ({funnelSteps[index + 1].dropOffCount.toLocaleString()} sessões)
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de Conversão Final:</span>
            <span className="font-bold text-lg text-primary">
              {funnelSteps.length > 0 
                ? ((funnelSteps[funnelSteps.length - 1].sessions / funnelSteps[0].sessions) * 100).toFixed(2)
                : 0}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

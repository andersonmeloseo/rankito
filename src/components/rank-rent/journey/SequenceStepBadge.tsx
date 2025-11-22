import { Home, FileText, Phone, LogOut, Clock, MessageCircle, Mail, MousePointerClick, FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

interface ClickEventSummary {
  pageUrl: string;
  eventType: string;
  count: number;
  ctaText?: string;
}

interface SequenceStepBadgeProps {
  url: string;
  type: "entry" | "intermediate" | "exit";
  sequenceNumber: number;
  totalSteps: number;
  avgTimeSpent?: number;
  clickEvents?: ClickEventSummary[];
}

export const SequenceStepBadge = ({ url, type, sequenceNumber, totalSteps, avgTimeSpent, clickEvents }: SequenceStepBadgeProps) => {
  const getClickIcon = (eventType: string) => {
    switch (eventType) {
      case 'whatsapp_click': return MessageCircle;
      case 'phone_click': return Phone;
      case 'email_click': return Mail;
      case 'form_submit': return FileSignature;
      default: return MousePointerClick;
    }
  };

  const getClickLabel = (eventType: string, count: number) => {
    const plural = count !== 1;
    switch (eventType) {
      case 'whatsapp_click': return plural ? 'cliques WhatsApp' : 'clique WhatsApp';
      case 'phone_click': return plural ? 'cliques Telefone' : 'clique Telefone';
      case 'email_click': return plural ? 'cliques Email' : 'clique Email';
      case 'form_submit': return plural ? 'envios Formulário' : 'envio Formulário';
      case 'button_click': return plural ? 'cliques em Botões' : 'clique em Botão';
      default: return plural ? 'Cliques' : 'Clique';
    }
  };
  const formatUrl = (url: string) => {
    try {
      const path = new URL(url).pathname;
      if (path === '/') return 'Home';
      return path.split('/').filter(Boolean).join(' / ');
    } catch {
      return url;
    }
  };

  const getIcon = (url: string, type: string) => {
    const path = formatUrl(url).toLowerCase();
    
    if (path === 'home' || path === '') return Home;
    if (path.includes('contact') || path.includes('contato')) return Phone;
    if (type === 'exit') return LogOut;
    return FileText;
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'entry':
        return {
          label: 'ENTRADA',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
          borderColor: 'border-emerald-300 dark:border-emerald-700',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          badgeVariant: 'default' as const,
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
        };
      case 'exit':
        return {
          label: 'SAÍDA',
          bgColor: 'bg-orange-50 dark:bg-orange-950/30',
          borderColor: 'border-orange-300 dark:border-orange-700',
          textColor: 'text-orange-700 dark:text-orange-300',
          badgeVariant: 'secondary' as const,
          badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
        };
      default:
        return {
          label: 'NAVEGAÇÃO',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-300 dark:border-blue-700',
          textColor: 'text-blue-700 dark:text-blue-300',
          badgeVariant: 'secondary' as const,
          badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
        };
    }
  };

  const Icon = getIcon(url, type);
  const config = getTypeConfig(type);
  const formattedUrl = formatUrl(url);

  return (
    <TooltipProvider>
      <div className={cn(
        "relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
        config.bgColor,
        config.borderColor
      )}>
        <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          config.textColor,
          "bg-white dark:bg-gray-900 border-2",
          config.borderColor
        )}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn("text-xs font-semibold", config.badgeBg)}>
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {sequenceNumber}/{totalSteps}
            </span>
          </div>
          
          <div className={cn("font-medium text-sm break-words", config.textColor)} title={url}>
            {formattedUrl}
          </div>

          {/* Time and Clicks Info */}
          {(avgTimeSpent !== undefined || (clickEvents && clickEvents.length > 0)) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {avgTimeSpent !== undefined && avgTimeSpent > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(Math.round(avgTimeSpent))}
                </Badge>
              )}
              {clickEvents?.map((click, idx) => {
                const ClickIcon = getClickIcon(click.eventType);
                
                // Se não há ctaText, renderiza badge simples
                if (!click.ctaText) {
                  return (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      <ClickIcon className="h-3 w-3" />
                      {click.count} {getClickLabel(click.eventType, click.count)}
                    </Badge>
                  );
                }
                
                // Se há ctaText, renderiza com tooltip
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="gap-1 cursor-help">
                        <ClickIcon className="h-3 w-3" />
                        {click.count} {getClickLabel(click.eventType, click.count)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        <span className="font-semibold">Texto do botão:</span> "{click.ctaText}"
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

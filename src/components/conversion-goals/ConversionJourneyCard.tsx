import { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, MousePointer, FileText, Clock, MapPin, Monitor, Smartphone, Tablet, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversionJourney } from "@/hooks/useConversionJourney";
import { formatPageName } from "@/lib/journey-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConversionJourneyCardProps {
  conversionId: string;
  goalName: string;
  conversionPage: string;
  conversionTime: string;
  sessionId: string | null;
  conversionValue?: number;
  ctaText?: string | null;
  eventType: string;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'whatsapp_click':
      return <MessageCircle className="h-3.5 w-3.5" />;
    case 'phone_click':
      return <Phone className="h-3.5 w-3.5" />;
    case 'email_click':
      return <Mail className="h-3.5 w-3.5" />;
    case 'form_submit':
      return <FileText className="h-3.5 w-3.5" />;
    default:
      return <MousePointer className="h-3.5 w-3.5" />;
  }
};

const getEventLabel = (eventType: string) => {
  switch (eventType) {
    case 'whatsapp_click':
      return 'WhatsApp';
    case 'phone_click':
      return 'Telefone';
    case 'email_click':
      return 'E-mail';
    case 'form_submit':
      return 'Formulário';
    default:
      return 'Clique';
  }
};

const getDeviceIcon = (device: string | null) => {
  if (!device) return <Monitor className="h-3.5 w-3.5" />;
  const d = device.toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return <Smartphone className="h-3.5 w-3.5" />;
  if (d.includes('tablet')) return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export const ConversionJourneyCard = ({
  conversionId,
  goalName,
  conversionPage,
  conversionTime,
  sessionId,
  conversionValue,
  ctaText,
  eventType
}: ConversionJourneyCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: journey, isLoading } = useConversionJourney(isExpanded ? sessionId : null);

  const formattedDate = format(new Date(conversionTime), "dd/MM HH:mm", { locale: ptBR });

  // Encontrar índice da página de conversão nas visits
  const conversionPageIndex = journey?.visits.findIndex(v => 
    v.page_url === conversionPage || v.page_url.includes(conversionPage)
  ) ?? -1;

  return (
    <Card className="overflow-hidden">
      {/* Header - Sempre visível */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-green-600">
            {getEventIcon(eventType)}
            <span className="text-sm font-medium">{getEventLabel(eventType)}</span>
          </div>
          
          <span className="text-muted-foreground">•</span>
          
          <span className="text-sm font-medium truncate">{goalName}</span>
          
          <span className="text-muted-foreground">•</span>
          
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
          
          {conversionValue && conversionValue > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <Badge variant="secondary" className="text-xs">
                R$ {conversionValue.toFixed(0)}
              </Badge>
            </>
          )}
        </div>
        
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="border-t px-3 py-3 space-y-3 bg-muted/30">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : !journey?.session ? (
            <p className="text-sm text-muted-foreground">
              Dados da sessão não disponíveis
            </p>
          ) : (
            <>
              {/* Indicador de jornada parcial */}
              {journey.isPartial && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                  <Info className="w-3 h-3 mr-1" />
                  Jornada parcial
                </Badge>
              )}

              {/* Info da sessão */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {getDeviceIcon(journey.session.device)}
                  <span>{journey.session.device || 'Desktop'}</span>
                </div>
                {(journey.session.city || journey.session.country) && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {[journey.session.city, journey.session.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </>
                )}
                {journey.session.total_duration_seconds && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Sessão: {formatDuration(journey.session.total_duration_seconds)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Timeline da jornada */}
              <div className="flex flex-wrap items-center gap-1.5">
                {journey.visits.length > 0 ? (
                  journey.visits.map((visit, index) => {
                    const isEntry = index === 0;
                    const isConversion = index === conversionPageIndex;
                    const isPostConversion = conversionPageIndex >= 0 && index > conversionPageIndex;
                    const isExit = index === journey.visits.length - 1 && !isConversion;

                    let badgeVariant: "default" | "secondary" | "outline" = "secondary";
                    let badgeClass = "text-xs";
                    let icon = "🔵";

                    if (isConversion) {
                      badgeClass += " bg-green-100 text-green-800 border-green-300";
                      icon = "🎯";
                    } else if (isEntry) {
                      badgeClass += " bg-green-100 text-green-800 border-green-300";
                      icon = "🟢";
                    } else if (isPostConversion) {
                      badgeClass += " bg-purple-100 text-purple-800 border-purple-300";
                      icon = "🟣";
                    } else if (isExit) {
                      badgeClass += " bg-red-100 text-red-800 border-red-300";
                      icon = "🔴";
                    }

                    return (
                      <div key={visit.id} className="flex items-center gap-1">
                        <Badge variant="outline" className={badgeClass}>
                          <span className="mr-1">{icon}</span>
                          #{index + 1} {formatPageName(visit.page_url)}
                          {visit.time_spent_seconds && visit.time_spent_seconds > 0 && (
                            <span className="ml-1 opacity-70">
                              ({formatDuration(visit.time_spent_seconds)})
                            </span>
                          )}
                        </Badge>
                        {index < journey.visits.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Nenhuma página registrada na sessão
                  </span>
                )}
              </div>

              {/* CTA que converteu */}
              {ctaText && (
                <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/30 p-2 rounded-md border border-green-200 dark:border-green-800">
                  <span className="text-green-600">{getEventIcon(eventType)}</span>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    "{ctaText}"
                  </span>
                  <span className="text-green-600/70 text-xs">
                    em {formatPageName(conversionPage)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};

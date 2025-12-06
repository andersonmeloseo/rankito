import { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, MousePointer, FileText, Clock, MapPin, Monitor, Smartphone, Tablet, Info, Target, ExternalLink, Globe, Hash } from "lucide-react";
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
  ipAddress?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
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

const getSourceInfo = (referrer: string | null): { icon: string; label: string } => {
  if (!referrer) return { icon: '🔗', label: 'Acesso Direto' };
  const r = referrer.toLowerCase();
  
  if (r.includes('google.com') || r.includes('google.com.br')) return { icon: '🔍', label: 'Google' };
  if (r.includes('bing.com')) return { icon: '🔍', label: 'Bing' };
  if (r.includes('instagram.com') || r.includes('l.instagram.com')) return { icon: '📸', label: 'Instagram' };
  if (r.includes('facebook.com') || r.includes('fb.com') || r.includes('l.facebook.com')) return { icon: '👥', label: 'Facebook' };
  if (r.includes('chatgpt.com') || r.includes('chat.openai.com')) return { icon: '🤖', label: 'ChatGPT' };
  if (r.includes('youtube.com')) return { icon: '▶️', label: 'YouTube' };
  if (r.includes('twitter.com') || r.includes('x.com') || r.includes('t.co')) return { icon: '🐦', label: 'X/Twitter' };
  if (r.includes('tiktok.com')) return { icon: '🎵', label: 'TikTok' };
  if (r.includes('linkedin.com')) return { icon: '💼', label: 'LinkedIn' };
  if (r.includes('pinterest.com')) return { icon: '📌', label: 'Pinterest' };
  if (r.includes('whatsapp.com') || r.includes('wa.me')) return { icon: '💬', label: 'WhatsApp' };
  if (r.includes('ads') || r.includes('gclid') || r.includes('utm_')) return { icon: '📢', label: 'Anúncio' };
  
  try {
    const domain = new URL(referrer).hostname.replace('www.', '');
    return { icon: '🌐', label: domain };
  } catch {
    return { icon: '🌐', label: 'Externo' };
  }
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
  eventType,
  ipAddress,
  city,
  region,
  country,
  referrer,
  userAgent
}: ConversionJourneyCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Passar conversionId para filtrar jornada até esta conversão específica
  const { data: journey, isLoading } = useConversionJourney(isExpanded ? sessionId : null, conversionId);

  const formattedDate = format(new Date(conversionTime), "dd/MM HH:mm", { locale: ptBR });

  // Build location string from props (fallback to journey data)
  const locationParts = [city, region, country].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(', ') : null;

  // Get device from userAgent prop or journey
  const getDeviceFromUserAgent = (ua: string | null | undefined): string => {
    if (!ua) return 'Desktop';
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return 'Mobile';
    if (lower.includes('tablet') || lower.includes('ipad')) return 'Tablet';
    return 'Desktop';
  };
  const deviceFromProps = userAgent ? getDeviceFromUserAgent(userAgent) : null;

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
          {/* Identificação do Visitante - Sempre visível quando expandido */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground bg-slate-50 p-2 rounded-md border">
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              <span className="font-mono">
                {sessionId || 'N/A'}
              </span>
            </div>
            {ipAddress && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span className="font-mono">{ipAddress}</span>
                </div>
              </>
            )}
            {locationString && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{locationString}</span>
                </div>
              </>
            )}
            {referrer && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span>{getSourceInfo(referrer).icon}</span>
                  <span>{getSourceInfo(referrer).label}</span>
                </div>
              </>
            )}
            {deviceFromProps && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {getDeviceIcon(deviceFromProps)}
                  <span>{deviceFromProps}</span>
                </div>
              </>
            )}
          </div>

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
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                  <Info className="w-3 h-3 mr-1" />
                  Conversão direta (1 página)
                </Badge>
              )}
              {/* Duração até conversão */}
              {journey.session.total_duration_seconds && journey.session.total_duration_seconds > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Até conversão: {formatDuration(journey.session.total_duration_seconds)}</span>
                </div>
              )}

              {/* Resumo textual da jornada */}
              {journey.visits.length > 0 && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                  {journey.visits.length === 1 ? (
                    <span>
                      Usuário entrou em <strong className="text-foreground">{formatPageName(journey.visits[0].page_url)}</strong> e converteu diretamente
                    </span>
                  ) : (
                    <span>
                      Usuário entrou em <strong className="text-foreground">{formatPageName(journey.visits[0].page_url)}</strong>, 
                      navegou por {journey.visits.length - 1} página{journey.visits.length > 2 ? 's' : ''} e 
                      converteu em <strong className="text-green-600">{formatPageName(conversionPage)}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Timeline da jornada */}
              <div className="flex flex-wrap items-center gap-1.5">
                {journey.visits.length > 0 ? (
                  journey.visits.map((visit, index) => {
                    const isEntry = index === 0;
                    const isLast = index === journey.visits.length - 1;
                    // Determinar se é a página de conversão
                    const isConversionPage = visit.isConversionPage || 
                      visit.page_url === conversionPage || 
                      visit.page_url.includes(conversionPage) ||
                      (isLast && journey.conversionPageUrl && visit.page_url === journey.conversionPageUrl);

                    let badgeClass = "text-xs font-medium ";
                    let icon = "";
                    let label = "";

                    if (isConversionPage) {
                      // CONVERSÃO - Destaque máximo em verde
                      badgeClass += "bg-green-100 text-green-800 border-green-500 border-2 shadow-sm";
                      icon = "🎯";
                      label = "CONVERTEU";
                    } else if (isEntry) {
                      // ENTRADA - Verde
                      badgeClass += "bg-green-100 text-green-800 border-green-300";
                      icon = "🟢";
                      label = "Entrada";
                    } else {
                      // NAVEGAÇÃO - Azul
                      badgeClass += "bg-blue-50 text-blue-700 border-blue-200";
                      icon = "🔵";
                      label = "";
                    }

                    return (
                      <div key={visit.id} className="flex items-center gap-1">
                        <Badge variant="outline" className={badgeClass}>
                          <span className="mr-1">{icon}</span>
                          {label && <span className="mr-1 text-[10px] uppercase opacity-80">{label}:</span>}
                          {formatPageName(visit.page_url)}
                          {visit.time_spent_seconds && visit.time_spent_seconds > 0 && (
                            <span className="ml-1.5 opacity-60 text-[10px]">
                              {formatDuration(visit.time_spent_seconds)}
                            </span>
                          )}
                        </Badge>
                        {index < journey.visits.length - 1 && (
                          <span className="text-muted-foreground font-bold">→</span>
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

              {/* CTA que converteu - Destacado */}
              {ctaText && (
                <div className="flex flex-col gap-2 text-sm bg-green-50 p-3 rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-green-600 font-semibold tracking-wide">
                        CTA que converteu
                      </span>
                      <span className="font-semibold text-green-800">
                        "{ctaText}"
                      </span>
                    </div>
                    <Badge className="ml-auto bg-green-600 text-white text-xs">
                      {formatPageName(conversionPage)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-green-200 pt-2">
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <a 
                      href={conversionPage} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-green-600 hover:underline truncate"
                      title={conversionPage}
                    >
                      {conversionPage}
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};
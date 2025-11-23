import { Badge } from "@/components/ui/badge";
import { formatDuration, formatPageName } from "@/lib/journey-utils";
import { Clock, Phone, Mail, MessageCircle, MousePointerClick, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClickEvent {
  id: string;
  event_type: string;
  page_url: string;
  created_at: string;
  cta_text: string | null;
  metadata: any;
}

interface SessionStepTimelineProps {
  pageUrl: string;
  pageTitle?: string | null;
  sequenceNumber: number;
  timeSpent: number | null;
  type: 'entry' | 'intermediate' | 'exit';
  clicks: ClickEvent[];
}

const getClickIcon = (eventType: string) => {
  switch (eventType) {
    case 'whatsapp_click':
      return <MessageCircle className="h-3 w-3" />;
    case 'phone_click':
      return <Phone className="h-3 w-3" />;
    case 'email_click':
      return <Mail className="h-3 w-3" />;
    case 'button_click':
      return <MousePointerClick className="h-3 w-3" />;
    case 'form_submit':
      return <FileText className="h-3 w-3" />;
    default:
      return <MousePointerClick className="h-3 w-3" />;
  }
};

const getClickLabel = (eventType: string) => {
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
      return 'Clique';
  }
};

export const SessionStepTimeline = ({
  pageUrl,
  pageTitle,
  sequenceNumber,
  timeSpent,
  type,
  clicks,
}: SessionStepTimelineProps) => {
  const typeConfig = {
    entry: {
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300',
      icon: '🟢',
      label: 'ENTRADA',
    },
    intermediate: {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300',
      icon: '🔵',
      label: 'NAVEGAÇÃO',
    },
    exit: {
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300',
      icon: '🔴',
      label: 'SAÍDA',
    },
  };

  const config = typeConfig[type];
  const pageName = formatPageName(pageUrl);

  return (
    <div className="border-l-2 border-border pl-4 pb-4 last:pb-0">
      <div className="flex items-start gap-3 mb-2">
        <span className="text-xl -ml-[30px]">{config.icon}</span>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("font-semibold", config.badge)}>
              {config.label}
            </Badge>
            <Badge variant="outline" className="bg-muted">
              #{sequenceNumber}
            </Badge>
            <span className="text-sm font-medium">{pageTitle || pageName}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {timeSpent !== null && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(timeSpent)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-ellipsis overflow-hidden">
              <span className="opacity-70">📍</span>
              <span className="truncate max-w-md">{pageUrl}</span>
            </div>
          </div>

          {/* Ações/Cliques */}
          {clicks.length > 0 && (
            <div className="space-y-1 ml-4 border-l-2 border-dashed border-border pl-3">
              {clicks.map((click) => (
                <div
                  key={click.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  {getClickIcon(click.event_type)}
                  <span className="font-medium">{getClickLabel(click.event_type)}:</span>
                  <span className="text-foreground">
                    {click.cta_text || 'Sem texto'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

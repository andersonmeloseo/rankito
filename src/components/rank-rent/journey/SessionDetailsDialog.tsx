import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useSessionDetails } from "@/hooks/useSessionDetails";
import { Clock, MapPin, Monitor, ExternalLink, MessageCircle, Phone, Mail, MousePointerClick, FileSignature } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionDetailsDialogProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionDetailsDialog = ({ sessionId, open, onOpenChange }: SessionDetailsDialogProps) => {
  const { data: session, isLoading } = useSessionDetails(sessionId || '');

  const getClickIcon = (eventType: string) => {
    switch (eventType) {
      case 'whatsapp_click': return MessageCircle;
      case 'phone_click': return Phone;
      case 'email_click': return Mail;
      case 'form_submit': return FileSignature;
      default: return MousePointerClick;
    }
  };

  const getClickLabel = (eventType: string) => {
    switch (eventType) {
      case 'whatsapp_click': return 'WhatsApp';
      case 'phone_click': return 'Telefone';
      case 'email_click': return 'Email';
      case 'form_submit': return 'Formulário';
      case 'button_click': return 'Botão';
      default: return 'Clique';
    }
  };

  const getClicksForPage = (pageUrl: string) => {
    return session?.clicks.filter(click => click.page_url === pageUrl) || [];
  };

  if (!sessionId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Sessão</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">Carregando detalhes...</div>
        ) : !session ? (
          <div className="py-8 text-center text-muted-foreground">
            Sessão não encontrada
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session Info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatDistanceToNow(new Date(session.entry_time), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{session.device || 'Desktop'}</Badge>
              </div>
              {session.city && session.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{session.city}, {session.country}</span>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Páginas Visitadas</div>
                <div className="text-2xl font-bold">{session.pages_visited}</div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Duração Total</div>
                <div className="text-2xl font-bold">
                  {session.total_duration_seconds 
                    ? formatTime(session.total_duration_seconds)
                    : '-'}
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Tempo Médio/Página</div>
                <div className="text-2xl font-bold">
                  {session.total_duration_seconds && session.pages_visited > 0
                    ? formatTime(Math.round(session.total_duration_seconds / session.pages_visited))
                    : '-'}
                </div>
              </div>
            </div>

            {/* Journey Timeline */}
            <div>
              <h3 className="font-semibold mb-4">Jornada Completa</h3>
              <div className="space-y-3">
                {session.visits.map((visit, index) => (
                  <div 
                    key={visit.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {visit.sequence_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {visit.page_title || new URL(visit.page_url).pathname}
                        </span>
                        <a 
                          href={visit.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {visit.page_url}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(visit.entry_time), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                        {visit.time_spent_seconds !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(visit.time_spent_seconds)}
                          </span>
                        )}
                      </div>

                      {/* Click Events */}
                      {getClicksForPage(visit.page_url).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {getClicksForPage(visit.page_url).map(click => {
                            const ClickIcon = getClickIcon(click.event_type);
                            return (
                              <Badge 
                                key={click.id} 
                                variant="secondary" 
                                className="text-xs gap-1"
                              >
                                <ClickIcon className="h-3 w-3" />
                                {click.cta_text || getClickLabel(click.event_type)}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {index === 0 ? (
                        <Badge variant="default" className="bg-green-500">Entrada</Badge>
                      ) : index === session.visits.length - 1 ? (
                        <Badge variant="destructive">Saída</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {session.referrer && (
              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground">Origem</div>
                <div className="text-sm truncate">{session.referrer}</div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

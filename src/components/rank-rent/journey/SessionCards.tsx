import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Clock, FileText, MapPin, Monitor } from "lucide-react";
import { useRecentSessionsEnriched, EnrichedSession } from "@/hooks/useRecentSessionsEnriched";
import { SessionStepTimeline } from "./SessionStepTimeline";
import { formatDuration } from "@/lib/journey-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionCardsProps {
  siteId: string;
}

export const SessionCards = ({ siteId }: SessionCardsProps) => {
  const { data: sessions, isLoading, error } = useRecentSessionsEnriched(siteId, 50);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar sessões. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma sessão registrada ainda. Aguarde as primeiras visitas ao site.
        </AlertDescription>
      </Alert>
    );
  }

  const getStepType = (index: number, total: number): 'entry' | 'intermediate' | 'exit' => {
    if (index === 0) return 'entry';
    if (index === total - 1) return 'exit';
    return 'intermediate';
  };

  const getClicksForPage = (session: EnrichedSession, pageUrl: string) => {
    return session.clicks.filter(click => click.page_url === pageUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {sessions.length} Sessões Recentes
        </h3>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {sessions.map((session) => {
          const hasClicks = session.clicks.length > 0;
          const conversionRate = hasClicks ? 100 : 0;

          return (
            <AccordionItem
              key={session.id}
              value={session.id}
              className="border rounded-lg shadow-sm hover:shadow-md transition-all bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="w-full text-left space-y-2">
                  {/* Header Info */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{session.pages_visited} páginas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(session.entry_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Page Title Preview */}
                  <div className="text-sm font-medium text-foreground line-clamp-1">
                    {session.visits[0]?.page_title || session.entry_page_url}
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>📊</span>
                      <span>{conversionRate.toFixed(1)}% converteu</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(session.total_duration_seconds || 0)}</span>
                    </div>
                    {session.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{session.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-4">
                  {/* Timeline de Páginas */}
                  <div className="space-y-2">
                    {session.visits.map((visit, index) => (
                      <SessionStepTimeline
                        key={visit.id}
                        pageUrl={visit.page_url}
                        pageTitle={visit.page_title}
                        sequenceNumber={visit.sequence_number}
                        timeSpent={visit.time_spent_seconds}
                        type={getStepType(index, session.visits.length)}
                        clicks={getClicksForPage(session, visit.page_url)}
                      />
                    ))}
                  </div>

                  {/* Footer Info */}
                  <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Tempo Total:</span>
                        <span>{formatDuration(session.total_duration_seconds || 0)}</span>
                      </div>
                      {session.city && session.country && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium">Localização:</span>
                          <span>{session.city}, {session.country}</span>
                        </div>
                      )}
                      {session.device && (
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3 w-3" />
                          <span className="font-medium">Dispositivo:</span>
                          <span>{session.device}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

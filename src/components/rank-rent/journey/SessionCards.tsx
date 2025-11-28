import { useState } from "react";
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
import { SessionFilters } from "./SessionFilters";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";

interface SessionCardsProps {
  siteId: string;
}

export const SessionCards = ({ siteId }: SessionCardsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [periodDays, setPeriodDays] = useState(90); // 3 meses padrão
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  // Novos filtros
  const [minPages, setMinPages] = useState(1);
  const [minDuration, setMinDuration] = useState(0);
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [conversionFilter, setConversionFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [excludeBots, setExcludeBots] = useState(false);

  const { data, isLoading, error } = useRecentSessionsEnriched(siteId, {
    page: currentPage,
    pageSize,
    startDate,
    endDate,
    minPages,
    minDuration,
    device: deviceFilter !== 'all' ? deviceFilter : undefined,
    hasClicks: conversionFilter === 'converted' ? true : conversionFilter === 'not_converted' ? false : undefined,
    city: locationFilter !== 'all' ? locationFilter : undefined,
    excludeBots,
  });

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

  const sessions = data?.sessions || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  if (!data && !isLoading && !error) {
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

  const handlePeriodChange = (days: number, start?: Date, end?: Date) => {
    setPeriodDays(days);
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
    } else {
      const newEnd = new Date();
      const newStart = new Date();
      newStart.setDate(newStart.getDate() - days);
      setStartDate(newStart);
      setEndDate(newEnd);
    }
    setCurrentPage(1); // Reset para primeira página
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1); // Reset para primeira página
  };

  const periodLabel = `Últimos ${periodDays} dias`;

  // Extrair localizações únicas das sessões
  const uniqueLocations = Array.from(
    new Set(sessions.map(s => s.city).filter((city): city is string => !!city))
  ).sort();

  const handleResetFilters = () => {
    setPeriodDays(90);
    handlePeriodChange(90);
    setMinPages(1);
    setMinDuration(0);
    setDeviceFilter('all');
    setConversionFilter('all');
    setLocationFilter('all');
    setExcludeBots(false);
    setCurrentPage(1);
  };

  // Gerar números de página para exibir
  const pageNumbers: (number | 'ellipsis')[] = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pageNumbers.push(i);
      pageNumbers.push('ellipsis');
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pageNumbers.push(1);
      pageNumbers.push('ellipsis');
      for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      pageNumbers.push('ellipsis');
      pageNumbers.push(currentPage - 1);
      pageNumbers.push(currentPage);
      pageNumbers.push(currentPage + 1);
      pageNumbers.push('ellipsis');
      pageNumbers.push(totalPages);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <SessionFilters
        totalSessions={totalCount}
        filteredCount={sessions.length}
        minPages={minPages}
        minDuration={minDuration}
        onMinPagesChange={(value) => {
          setMinPages(value);
          setCurrentPage(1);
        }}
        onMinDurationChange={(value) => {
          setMinDuration(value);
          setCurrentPage(1);
        }}
        onReset={handleResetFilters}
        periodDays={periodDays}
        onPeriodChange={handlePeriodChange}
        customDateRange={customDateRange}
        onCustomDateRangeChange={setCustomDateRange}
        periodLabel={periodLabel}
        deviceFilter={deviceFilter}
        onDeviceFilterChange={(value) => {
          setDeviceFilter(value);
          setCurrentPage(1);
        }}
        conversionFilter={conversionFilter}
        onConversionFilterChange={(value) => {
          setConversionFilter(value);
          setCurrentPage(1);
        }}
        locationFilter={locationFilter}
        onLocationFilterChange={(value) => {
          setLocationFilter(value);
          setCurrentPage(1);
        }}
        uniqueLocations={uniqueLocations}
        excludeBots={excludeBots}
        onExcludeBotsChange={(value) => {
          setExcludeBots(value);
          setCurrentPage(1);
        }}
      />

      {/* Header com contador e controle de itens por página */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} de {totalCount} sessões
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página:</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                        <span>
                          {session.city}
                          {session.bot_name && (
                            <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                              ({session.bot_name})
                            </span>
                          )}
                        </span>
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
                        sequenceNumber={index + 1}
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {pageNumbers.map((pageNum, idx) => (
                <PaginationItem key={idx}>
                  {pageNum === 'ellipsis' ? (
                    <span className="px-4 py-2">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <p className="text-xs text-muted-foreground">
            Página {currentPage} de {totalPages} • {pageSize} por página
          </p>
        </div>
      )}
    </div>
  );
};

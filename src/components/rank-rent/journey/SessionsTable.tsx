import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecentSessionsEnriched } from "@/hooks/useRecentSessionsEnriched";
import { Eye } from "lucide-react";
import { formatDistanceToNow, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatTime } from "@/lib/utils";
import { SessionDetailsDialog } from "./SessionDetailsDialog";
import { SessionFilters } from "./SessionFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SessionsTableProps {
  siteId: string;
}

export const SessionsTable = ({ siteId }: SessionsTableProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Período - padrão 90 dias (3 meses)
  const [periodDays, setPeriodDays] = useState(90);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 90));
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Filtros
  const [minPages, setMinPages] = useState(1);
  const [minDuration, setMinDuration] = useState(0);
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [conversionFilter, setConversionFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [botFilter, setBotFilter] = useState<'all' | 'humans' | 'bots'>('all');

  const { data: sessionsData, isLoading, error } = useRecentSessionsEnriched(siteId, {
    page: currentPage,
    pageSize,
    startDate,
    endDate,
    minPages,
    minDuration,
    device: deviceFilter !== 'all' ? deviceFilter : undefined,
    hasClicks: conversionFilter === 'with_clicks' ? true : conversionFilter === 'no_clicks' ? false : undefined,
    city: locationFilter !== 'all' ? locationFilter : undefined,
    botFilter
  });

  const sessions = sessionsData?.sessions || [];
  const totalPages = sessionsData ? Math.ceil(sessionsData.totalCount / pageSize) : 0;

  const handlePeriodChange = (days: number, startDate?: Date, endDate?: Date) => {
    setPeriodDays(days);
    if (startDate && endDate) {
      setCustomDateRange({ from: startDate, to: endDate });
      setStartDate(startDate);
      setEndDate(endDate);
    } else {
      setCustomDateRange(null);
      setStartDate(subDays(new Date(), days));
      setEndDate(new Date());
    }
    setCurrentPage(1);
  };

  const handleCustomDateRangeChange = (dateRange: { from: Date; to?: Date } | undefined) => {
    if (dateRange?.from && dateRange?.to) {
      setCustomDateRange({ from: dateRange.from, to: dateRange.to });
      setStartDate(dateRange.from);
      setEndDate(dateRange.to);
      setCurrentPage(1);
    }
  };

  const handleResetFilters = () => {
    setPeriodDays(90);
    setCustomDateRange(null);
    setStartDate(subDays(new Date(), 90));
    setEndDate(new Date());
    setMinPages(1);
    setMinDuration(0);
    setDeviceFilter('all');
    setConversionFilter('all');
    setLocationFilter('all');
    setBotFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando sessões...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Erro ao carregar sessões
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <>
        <SessionFilters
          totalSessions={sessionsData?.totalCount || 0}
          filteredCount={sessionsData?.totalCount || 0}
          periodDays={periodDays}
          onPeriodChange={handlePeriodChange}
          customDateRange={customDateRange}
          onCustomDateRangeChange={handleCustomDateRangeChange}
          minPages={minPages}
          onMinPagesChange={setMinPages}
          minDuration={minDuration}
          onMinDurationChange={setMinDuration}
          deviceFilter={deviceFilter}
          onDeviceFilterChange={setDeviceFilter}
          conversionFilter={conversionFilter}
          onConversionFilterChange={setConversionFilter}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
          botFilter={botFilter}
          onBotFilterChange={setBotFilter}
          onReset={handleResetFilters}
        />
        <Card className="mt-4">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma sessão encontrada para os filtros aplicados
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <SessionFilters
        totalSessions={sessionsData?.totalCount || 0}
        filteredCount={sessionsData?.totalCount || 0}
        periodDays={periodDays}
        onPeriodChange={handlePeriodChange}
        customDateRange={customDateRange}
        onCustomDateRangeChange={handleCustomDateRangeChange}
        minPages={minPages}
        onMinPagesChange={setMinPages}
        minDuration={minDuration}
        onMinDurationChange={setMinDuration}
        deviceFilter={deviceFilter}
        onDeviceFilterChange={setDeviceFilter}
        conversionFilter={conversionFilter}
        onConversionFilterChange={setConversionFilter}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
        botFilter={botFilter}
        onBotFilterChange={setBotFilter}
        onReset={handleResetFilters}
      />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Sessões Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-sm">Data/Hora</th>
                  <th className="text-left p-2 font-medium text-sm">Página Entrada</th>
                  <th className="text-left p-2 font-medium text-sm">Página Saída</th>
                  <th className="text-right p-2 font-medium text-sm">Páginas</th>
                  <th className="text-right p-2 font-medium text-sm">Duração</th>
                  <th className="text-left p-2 font-medium text-sm">Dispositivo</th>
                  <th className="text-left p-2 font-medium text-sm">Localização</th>
                  <th className="text-center p-2 font-medium text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-sm">
                      {formatDistanceToNow(new Date(session.entry_time), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </td>
                    <td className="p-2 text-sm truncate max-w-[200px]">
                      {new URL(session.entry_page_url).pathname}
                    </td>
                    <td className="p-2 text-sm truncate max-w-[200px]">
                      {session.exit_page_url 
                        ? new URL(session.exit_page_url).pathname 
                        : '-'}
                    </td>
                    <td className="p-2 text-sm text-right">
                      {session.pages_visited}
                    </td>
                    <td className="p-2 text-sm text-right">
                      {session.total_duration_seconds 
                        ? formatTime(session.total_duration_seconds)
                        : '-'}
                    </td>
                    <td className="p-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {session.device || 'Desktop'}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">
                    {session.city && session.country 
                      ? (
                        <>
                          {session.city}, {session.country}
                          {session.bot_name && (
                            <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                              ({session.bot_name})
                            </span>
                          )}
                        </>
                      )
                      : session.country || '-'}
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com paginação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t mt-4">
            <div className="text-sm text-muted-foreground">
              {sessionsData?.totalCount || 0} sessões • Últimos {periodDays} dias
            </div>
            
            <div className="flex items-center gap-4">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Por página:</span>
                <Select value={String(pageSize)} onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <SessionDetailsDialog
        sessionId={selectedSessionId}
        open={!!selectedSessionId}
        onOpenChange={(open) => !open && setSelectedSessionId(null)}
      />
    </>
  );
};

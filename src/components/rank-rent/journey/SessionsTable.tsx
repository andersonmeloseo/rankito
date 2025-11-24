import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecentSessions } from "@/hooks/useRecentSessions";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatTime } from "@/lib/utils";
import { SessionDetailsDialog } from "./SessionDetailsDialog";

interface SessionsTableProps {
  siteId: string;
}

export const SessionsTable = ({ siteId }: SessionsTableProps) => {
  const { data: sessions, isLoading } = useRecentSessions(siteId, 50);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (isLoading) {
    return <div>Carregando sessões...</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma sessão registrada ainda
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
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

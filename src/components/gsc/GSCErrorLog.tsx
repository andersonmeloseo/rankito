import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, RefreshCw, ExternalLink, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorLog {
  id: string;
  url: string;
  status: string;
  submitted_at: string | null;
  error_message: string | null;
  integration_id: string;
  integration?: {
    connection_name: string;
    google_email: string;
  } | null;
}

interface GSCErrorLogProps {
  siteId: string;
}

export function GSCErrorLog({ siteId }: GSCErrorLogProps) {
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Buscar apenas URLs que falharam
  const { data: errorLogs, isLoading } = useQuery<ErrorLog[]>({
    queryKey: ["gsc-error-logs", siteId],
    queryFn: async () => {
      // Primeiro buscar IDs de integrações do site
      const { data: integrations } = await supabase
        .from("google_search_console_integrations")
        .select("id")
        .eq("site_id", siteId);

      if (!integrations || integrations.length === 0) {
        return [];
      }

      const integrationIds = integrations.map((i: any) => i.id);

      // Buscar apenas requests com status failed/error
      const { data, error } = await supabase
        .from("gsc_url_indexing_requests")
        .select(`
          id,
          url,
          status,
          submitted_at,
          error_message,
          integration_id,
          integration:google_search_console_integrations(
            connection_name,
            google_email
          )
        `)
        .in("integration_id", integrationIds)
        .in("status", ["failed", "error"])
        .order("submitted_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Mutation para reenviar URLs com erro
  const retryMutation = useMutation({
    mutationFn: async (selectedLogs: ErrorLog[]) => {
      // Agrupar URLs por integration_id para manter a mesma integração que falhou
      const urlsByIntegration = selectedLogs.reduce((acc, log) => {
        const integrationId = log.integration_id;
        if (!acc[integrationId]) {
          acc[integrationId] = [];
        }
        acc[integrationId].push(log.url);
        return acc;
      }, {} as Record<string, string[]>);

      // Inserir na fila de indexação mantendo a mesma integração
      const queueItems = Object.entries(urlsByIntegration).flatMap(([integrationId, urls]) =>
        urls.map((url) => ({
          integration_id: integrationId,
          url: url,
          scheduled_for: new Date().toISOString().split("T")[0],
          status: "pending",
        }))
      );

      const { error } = await supabase
        .from("gsc_indexing_queue")
        .insert(queueItems);

      if (error) throw error;

      return queueItems.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} URL(s) reenviada(s) para a fila de indexação`);
      setSelectedErrors(new Set());
      queryClient.invalidateQueries({ queryKey: ["gsc-error-logs", siteId] });
      queryClient.invalidateQueries({ queryKey: ["gsc-indexing-queue", siteId] });
    },
    onError: (error: any) => {
      toast.error("Erro ao reenviar URLs", {
        description: error.message,
      });
    },
  });

  // Mutation para remover logs de erro
  const removeMutation = useMutation({
    mutationFn: async (requestIds: string[]) => {
      const { error } = await supabase
        .from("gsc_url_indexing_requests")
        .delete()
        .in("id", requestIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Logs de erro removidos com sucesso");
      setSelectedErrors(new Set());
      queryClient.invalidateQueries({ queryKey: ["gsc-error-logs", siteId] });
    },
    onError: (error: any) => {
      toast.error("Erro ao remover logs", {
        description: error.message,
      });
    },
  });

  const handleToggleError = (id: string) => {
    const newSelected = new Set(selectedErrors);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedErrors(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedErrors.size === errorLogs?.length) {
      setSelectedErrors(new Set());
    } else {
      setSelectedErrors(new Set(errorLogs?.map((log) => log.id) || []));
    }
  };

  const handleRetrySelected = () => {
    if (selectedErrors.size === 0) {
      toast.error("Selecione pelo menos um erro para reenviar");
      return;
    }

    const selectedLogs = errorLogs?.filter((log) => selectedErrors.has(log.id)) || [];
    retryMutation.mutate(selectedLogs);
  };

  const handleRemoveSelected = () => {
    if (selectedErrors.size === 0) {
      toast.error("Selecione pelo menos um erro para remover");
      return;
    }

    removeMutation.mutate(Array.from(selectedErrors));
  };

  const handleRetryOne = (log: ErrorLog) => {
    retryMutation.mutate([log]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando logs de erro...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!errorLogs || errorLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Log de Erros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ Nenhum erro registrado! Todas as URLs foram enviadas com sucesso.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Log de Erros ({errorLogs.length})
          </div>
          <div className="flex items-center gap-2">
            {selectedErrors.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetrySelected}
                  disabled={retryMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reenviar Selecionados ({selectedErrors.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveSelected}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Selecionados
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>URLs com Falha:</strong> Selecione as URLs que deseja reenviar para a fila de
            indexação ou remover do log.
          </AlertDescription>
        </Alert>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedErrors.size === errorLogs.length}
                    onCheckedChange={handleToggleAll}
                  />
                </TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Integração GSC</TableHead>
                <TableHead>Data da Falha</TableHead>
                <TableHead>Mensagem de Erro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedErrors.has(log.id)}
                      onCheckedChange={() => handleToggleError(log.id)}
                    />
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex items-center gap-2">
                      <a
                        href={log.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {new URL(log.url).pathname}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {log.integration?.connection_name || "N/A"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {log.integration?.google_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {log.submitted_at
                        ? formatDistanceToNow(new Date(log.submitted_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-xs truncate" title={log.error_message || "Erro desconhecido"}>
                      {log.error_message || "Erro desconhecido"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetryOne(log)}
                      disabled={retryMutation.isPending}
                      title="Reenviar esta URL"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

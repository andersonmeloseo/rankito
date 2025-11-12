import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGSCIndexing } from "@/hooks/useGSCIndexing";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GSCIndexingManagerProps {
  integrationId: string;
  integrationName: string;
  siteId: string;
}

export function GSCIndexingManager({ integrationId, integrationName, siteId }: GSCIndexingManagerProps) {
  const [customUrl, setCustomUrl] = useState("");

  const {
    quota,
    recentRequests,
    resetAt,
    isLoadingQuota,
    requestIndexing,
    isRequesting,
    refetchQuota,
  } = useGSCIndexing({ integrationId });

  // Fetch site pages
  const { data: pages, isLoading: isLoadingPages } = useQuery({
    queryKey: ['site-pages', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_pages')
        .select('*')
        .eq('site_id', siteId)
        .eq('status', 'active')
        .order('page_path');

      if (error) throw error;
      return data || [];
    },
  });

  const handleIndexCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    await requestIndexing.mutateAsync({ url: customUrl.trim() });
    setCustomUrl("");
  };

  const handleIndexPage = async (pageId: string, pageUrl: string) => {
    await requestIndexing.mutateAsync({ url: pageUrl, page_id: pageId });
  };

  const getStatusBadge = (status: string, errorMessage: string | null) => {
    if (status === 'success') {
      return <Badge variant="outline" className="border-green-500 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Sucesso</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
    return (
      <Badge variant="destructive" title={errorMessage || undefined}>
        <XCircle className="h-3 w-3 mr-1" />Erro
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getQuotaColor = () => {
    if (!quota) return "bg-gray-500";
    if (quota.percentage >= 90) return "bg-red-500";
    if (quota.percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoadingQuota) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quota Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Indexação Instantânea - {integrationName}
              </CardTitle>
              <CardDescription className="mt-2">
                Solicite a indexação de URLs diretamente ao Google Search Console (limite: 200 URLs/dia)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchQuota()}
              disabled={isLoadingQuota}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingQuota ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {quota && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Quota Diária</p>
                  <p className="text-2xl font-bold">
                    {quota.used} / {quota.limit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {quota.remaining} URLs restantes hoje
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={quota.remaining > 0 ? "outline" : "destructive"} className="text-lg px-4 py-2">
                    {quota.percentage}%
                  </Badge>
                  {resetAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Renova em: {formatDate(resetAt)}
                    </p>
                  )}
                </div>
              </div>
              <Progress value={quota.percentage} className={`h-3 ${getQuotaColor()}`} />
              
              {quota.remaining === 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Limite diário atingido. A quota será renovada automaticamente às 00:00 UTC.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Index Custom URL */}
      <Card>
        <CardHeader>
          <CardTitle>Indexar URL Customizada</CardTitle>
          <CardDescription>
            Envie qualquer URL para indexação no Google Search Console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIndexCustomUrl} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-url">URL Completa</Label>
              <Input
                id="custom-url"
                type="url"
                placeholder="https://exemplo.com/pagina"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                disabled={isRequesting || quota?.remaining === 0}
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isRequesting || !customUrl.trim() || quota?.remaining === 0}
            >
              {isRequesting ? "Enviando..." : "Solicitar Indexação"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Site Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Páginas do Site</CardTitle>
          <CardDescription>
            Selecione páginas para solicitar indexação no Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPages ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : pages && pages.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">Página</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        {page.page_title || page.page_path}
                      </TableCell>
                      <TableCell>
                        <a
                          href={page.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          {page.page_path}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIndexPage(page.id, page.page_url)}
                          disabled={isRequesting || quota?.remaining === 0}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Indexar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Nenhuma página ativa encontrada neste site. Importe o sitemap primeiro.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      {recentRequests && recentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico Recente</CardTitle>
            <CardDescription>
              Últimas 10 solicitações de indexação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium text-sm">
                        <a
                          href={request.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {request.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status, request.error_message)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(request.submitted_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

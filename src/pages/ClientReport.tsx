import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, TrendingUp, Eye, MousePointerClick } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClientReport() {
  const { token } = useParams();
  const [period, setPeriod] = useState("30");

  const { data: report, isLoading } = useQuery({
    queryKey: ["client-report", token, period],
    queryFn: async () => {
      if (!token) throw new Error("Token not provided");

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const { data, error } = await supabase.functions.invoke("generate-client-report", {
        body: {
          access_token: token,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      });

      if (error) throw error;
      return data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Acesso Inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este link de relatório é inválido ou expirou. Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{report.client.name}</h1>
              {report.client.company && (
                <p className="text-muted-foreground">{report.client.company}</p>
              )}
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Páginas Ativas</CardTitle>
              <BarChart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.summary.total_pages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.summary.total_page_views.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <MousePointerClick className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{report.summary.total_conversions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{report.summary.conversion_rate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Conversões por Tipo */}
        {report.conversions_by_type && Object.keys(report.conversions_by_type).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(report.conversions_by_type).map(([type, count]) => (
                  <div key={type} className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Badge className="mb-2">{type.replace('_', ' ')}</Badge>
                    <span className="text-2xl font-bold">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Páginas com Métricas */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Página</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.pages && report.pages.length > 0 ? (
                report.pages.map((page: any, idx: number) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{page.page_title}</h4>
                        <p className="text-xs text-muted-foreground truncate max-w-md">{page.page_url}</p>
                      </div>
                      <Badge variant={Number(page.conversion_rate) > 5 ? "default" : "outline"}>
                        {page.conversion_rate}% conversão
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Visualizações: </span>
                        <span className="font-semibold">{page.page_views}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversões: </span>
                        <span className="font-semibold text-primary">{page.conversions}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma página com dados neste período</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Relatório gerado em {new Date().toLocaleString('pt-BR')}</p>
          <p className="mt-1">Este relatório é confidencial e destinado exclusivamente para {report.client.name}</p>
        </div>
      </div>
    </div>
  );
}
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ExternalLink, AlertCircle, RefreshCw, Eye, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TopProjectsPerformanceProps {
  userId: string;
}

interface ProjectPerformance {
  site_id: string;
  site_name: string;
  site_url: string;
  is_rented: boolean;
  total_conversions: number;
  page_views: number;
  conversion_events: number;
}

export const TopProjectsPerformance = ({ userId }: TopProjectsPerformanceProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: topProjects, isLoading, error, refetch } = useQuery({
    queryKey: ["top-projects-performance", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_top_projects_performance',
        { 
          user_id: userId, 
          days_ago: 30, 
          limit_count: 5 
        }
      );

      if (error) throw error;
      return (data || []) as ProjectPerformance[];
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });

  if (error) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Top 5 Projetos por Performance (últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{error instanceof Error ? error.message : "Erro desconhecido"}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
              >
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Top 5 Projetos por Performance (últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!topProjects || topProjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Top Projetos por Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma conversão registrada
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              Adicione o pixel de rastreamento aos seus sites para começar a visualizar métricas de performance
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxConversions = Math.max(...topProjects.map(p => p.total_conversions));

  const getRankBadge = (index: number) => {
    const badges = [
      { label: "🥇 1º", variant: "default" as const, class: "bg-yellow-100 text-yellow-700 border-yellow-300" },
      { label: "🥈 2º", variant: "secondary" as const, class: "bg-gray-100 text-gray-700 border-gray-300" },
      { label: "🥉 3º", variant: "secondary" as const, class: "bg-orange-100 text-orange-700 border-orange-300" },
      { label: `${index + 1}º`, variant: "outline" as const, class: "" },
    ];
    return badges[index] || badges[3];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Top Projetos por Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Últimos 30 dias</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["top-projects-performance"] })}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProjects.map((project, index) => {
            const rankBadge = getRankBadge(index);
            const progressPercentage = maxConversions > 0 
              ? (project.total_conversions / maxConversions) * 100 
              : 0;

            return (
              <div
                key={project.site_id}
                onClick={() => navigate(`/dashboard/site/${project.site_id}`)}
                className="
                  relative overflow-hidden rounded-lg border border-gray-200 
                  bg-white p-4 transition-all cursor-pointer
                  hover:shadow-md hover:border-blue-300 hover:scale-[1.01]
                "
              >
                {/* Progress Bar Background */}
                <div 
                  className="absolute inset-0 bg-blue-50 opacity-30 transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />

                {/* Content */}
                <div className="relative space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge className={rankBadge.class}>
                        {rankBadge.label}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {project.site_name}
                        </h4>
                        <a
                          href={project.site_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                        >
                          {project.site_url}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                    <Badge variant={project.is_rented ? "success" : "outline"}>
                      {project.is_rented ? "Alugado" : "Disponível"}
                    </Badge>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-lg font-bold text-gray-900">
                          {project.total_conversions}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Views</p>
                        <p className="text-lg font-bold text-gray-900">
                          {project.page_views}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <MousePointerClick className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Eventos</p>
                        <p className="text-lg font-bold text-gray-900">
                          {project.conversion_events}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

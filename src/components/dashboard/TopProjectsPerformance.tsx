import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, MousePointerClick, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

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

  const { data: topProjects, isLoading } = useQuery({
    queryKey: ["top-projects-performance", userId],
    queryFn: async () => {
      // Buscar sites do usuário
      const { data: sites, error: sitesError } = await supabase
        .from("rank_rent_sites")
        .select("id, site_name, site_url, is_rented")
        .eq("owner_user_id", userId);

      if (sitesError) throw sitesError;
      if (!sites || sites.length === 0) return [];

      // Buscar conversões dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: conversions, error: conversionsError } = await supabase
        .from("rank_rent_conversions")
        .select("site_id, event_type")
        .in("site_id", sites.map(s => s.id))
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (conversionsError) throw conversionsError;

      // Agregar métricas por site
      const performanceMap = new Map<string, ProjectPerformance>();

      sites.forEach(site => {
        const siteConversions = conversions?.filter(c => c.site_id === site.id) || [];
        
        performanceMap.set(site.id, {
          site_id: site.id,
          site_name: site.site_name,
          site_url: site.site_url,
          is_rented: site.is_rented || false,
          total_conversions: siteConversions.length,
          page_views: siteConversions.filter(c => c.event_type === 'page_view').length,
          conversion_events: siteConversions.filter(c => 
            c.event_type === 'whatsapp_click' || 
            c.event_type === 'phone_click' || 
            c.event_type === 'email_click' ||
            c.event_type === 'button_click'
          ).length,
        });
      });

      // Ordenar por total de conversões e pegar top 5
      return Array.from(performanceMap.values())
        .sort((a, b) => b.total_conversions - a.total_conversions)
        .slice(0, 5);
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Top Projetos por Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5" />
          Top Projetos por Performance
          <Badge variant="outline" className="ml-auto">Últimos 30 dias</Badge>
        </CardTitle>
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

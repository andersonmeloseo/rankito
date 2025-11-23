import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Store, MessageSquare, Calendar, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface GBPIntegrationCardProps {
  siteId: string;
}

export function GBPIntegrationCard({ siteId }: GBPIntegrationCardProps) {
  const navigate = useNavigate();

  // Fetch GBP profiles for this site
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["gbp-profiles-card", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_business_profiles")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch unanswered reviews count
  const { data: unansweredCount } = useQuery({
    queryKey: ["gbp-unanswered-reviews", siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("gbp_reviews")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("is_replied", false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!siteId,
  });

  // Fetch scheduled posts count
  const { data: scheduledCount } = useQuery({
    queryKey: ["gbp-scheduled-posts", siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("gbp_posts")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("status", "scheduled");
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!siteId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-5 w-5" />
            Google Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-5 w-5" />
            Google Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Nenhuma integração configurada
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/dashboard/site/${siteId}?tab=gbp`)}
          >
            Conectar GBP
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeProfiles = profiles.filter((p) => p.is_active);
  const hasErrors = profiles.some((p) => p.health_status === "unhealthy");
  const latestSync = profiles
    .filter((p) => p.last_sync_at)
    .sort((a, b) => new Date(b.last_sync_at!).getTime() - new Date(a.last_sync_at!).getTime())[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Google Business Profile
          </div>
          {hasErrors ? (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Erro
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Ativo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Integration Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{activeProfiles.length}</div>
            <div className="text-xs text-muted-foreground">
              Perfil{activeProfiles.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <MessageSquare className="h-4 w-4 text-orange-500" />
              <div className="text-2xl font-bold">{unansweredCount || 0}</div>
            </div>
            <div className="text-xs text-muted-foreground">Sem Resposta</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="text-2xl font-bold">{scheduledCount || 0}</div>
            </div>
            <div className="text-xs text-muted-foreground">Agendados</div>
          </div>
        </div>

        {/* Last Sync */}
        {latestSync?.last_sync_at && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            Última sincronização:{" "}
            {formatDistanceToNow(new Date(latestSync.last_sync_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </div>
        )}

        {/* Action Button */}
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/dashboard/site/${siteId}?tab=gbp`)}
        >
          Gerenciar GBP
          <ExternalLink className="ml-2 h-3 w-3" />
        </Button>

        {/* Error Warning */}
        {hasErrors && (
          <div className="text-xs text-destructive flex items-start gap-2 bg-destructive/10 p-2 rounded">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Algumas integrações apresentam erro. Verifique as configurações.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

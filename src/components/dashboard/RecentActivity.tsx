import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MousePointerClick, FileText, DollarSign, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentActivityProps {
  userId: string;
}

export const RecentActivity = ({ userId }: RecentActivityProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities', userId],
    queryFn: async () => {
      const { data: conversions } = await supabase
        .from('rank_rent_conversions')
        .select(`
          id,
          event_type,
          created_at,
          rank_rent_pages(page_title, page_url, rank_rent_sites(site_name))
        `)
        .eq('rank_rent_sites.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      return conversions?.map(c => ({
        id: c.id,
        type: 'conversion' as const,
        title: `Nova conversão em ${c.rank_rent_pages?.rank_rent_sites?.site_name}`,
        description: c.rank_rent_pages?.page_title || c.rank_rent_pages?.page_url,
        timestamp: c.created_at,
        icon: MousePointerClick,
      })) || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <activity.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma atividade recente
          </p>
        )}
      </CardContent>
    </Card>
  );
};

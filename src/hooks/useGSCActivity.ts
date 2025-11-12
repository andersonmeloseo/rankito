import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ActivityType = 
  | 'integration_connected' 
  | 'integration_disconnected' 
  | 'sitemap_submitted' 
  | 'sitemap_deleted' 
  | 'url_indexed' 
  | 'indexing_error' 
  | 'sitemap_error';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  integration_name: string;
  timestamp: string;
  metadata?: {
    url?: string;
    sitemap_url?: string;
    error_message?: string;
  };
}

export function useGSCActivity({ siteId }: { siteId: string }) {
  const { data: activityTimeline, isLoading, refetch } = useQuery({
    queryKey: ['gsc-activity', siteId],
    queryFn: async () => {
      const activities: Activity[] = [];

      // 1. Buscar indexing requests recentes
      const { data: indexingRequests } = await supabase
        .from('gsc_url_indexing_requests')
        .select(`
          id,
          url,
          status,
          error_message,
          submitted_at,
          integration:google_search_console_integrations!inner(
            connection_name,
            site_id
          )
        `)
        .eq('integration.site_id', siteId)
        .order('submitted_at', { ascending: false })
        .limit(50);

      indexingRequests?.forEach((req: any) => {
        activities.push({
          id: req.id,
          type: req.status === 'success' ? 'url_indexed' : 'indexing_error',
          title: req.status === 'success' ? 'URL indexada com sucesso' : 'Erro na indexação de URL',
          description: req.url,
          integration_name: req.integration.connection_name,
          timestamp: req.submitted_at,
          metadata: {
            url: req.url,
            error_message: req.error_message,
          },
        });
      });

      // 2. Buscar submissões de sitemap recentes
      const { data: sitemapSubmissions } = await supabase
        .from('gsc_sitemap_submissions')
        .select(`
          id,
          sitemap_url,
          gsc_status,
          gsc_errors_count,
          gsc_last_submitted,
          integration:google_search_console_integrations!inner(
            connection_name,
            site_id
          )
        `)
        .eq('integration.site_id', siteId)
        .not('gsc_last_submitted', 'is', null)
        .order('gsc_last_submitted', { ascending: false, nullsFirst: false })
        .limit(30);

      sitemapSubmissions?.forEach((sub: any) => {
        if (sub.gsc_errors_count > 0) {
          activities.push({
            id: `sitemap-error-${sub.id}`,
            type: 'sitemap_error',
            title: 'Erros encontrados no sitemap',
            description: sub.sitemap_url,
            integration_name: sub.integration.connection_name,
            timestamp: sub.gsc_last_submitted,
            metadata: {
              sitemap_url: sub.sitemap_url,
            },
          });
        } else {
          activities.push({
            id: `sitemap-submitted-${sub.id}`,
            type: 'sitemap_submitted',
            title: 'Sitemap submetido ao GSC',
            description: sub.sitemap_url,
            integration_name: sub.integration.connection_name,
            timestamp: sub.gsc_last_submitted,
            metadata: {
              sitemap_url: sub.sitemap_url,
            },
          });
        }
      });

      // 3. Ordenar por timestamp descendente
      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    enabled: !!siteId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  return {
    activityTimeline: activityTimeline || [],
    isLoading,
    refetch,
  };
}

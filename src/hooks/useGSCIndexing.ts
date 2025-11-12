import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IndexingQuota {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

interface IndexingRequest {
  id: string;
  integration_id: string;
  page_id: string | null;
  url: string;
  request_type: string;
  status: string;
  error_message: string | null;
  gsc_notification_id: string | null;
  gsc_response: any;
  submitted_at: string;
  completed_at: string | null;
  created_at: string;
}

interface UseGSCIndexingParams {
  siteId: string | null;
}

export function useGSCIndexing({ siteId }: UseGSCIndexingParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch aggregated quota
  const { data: quotaData, isLoading: isLoadingQuota, refetch: refetchQuota } = useQuery({
    queryKey: ['gsc-aggregated-quota', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      console.log('🔍 Fetching aggregated GSC quota for site:', siteId);

      const { data, error } = await supabase.functions.invoke('gsc-get-aggregated-quota', {
        body: { site_id: siteId },
      });

      if (error) {
        console.error('❌ Error fetching aggregated quota:', error);
        throw new Error(error.message || 'Failed to fetch aggregated quota');
      }

      // Buscar histórico recente de todas integrações
      const { data: requests, error: requestsError } = await supabase
        .from('gsc_url_indexing_requests')
        .select('*, google_search_console_integrations!inner(site_id)')
        .eq('google_search_console_integrations.site_id', siteId)
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (requestsError) {
        console.error('❌ Error fetching requests:', requestsError);
      }

      console.log('✅ Aggregated quota fetched:', data.aggregated_quota);
      return {
        quota: {
          used: data.aggregated_quota.total_used,
          limit: data.aggregated_quota.total_limit,
          remaining: data.aggregated_quota.total_remaining,
          percentage: data.aggregated_quota.percentage,
        } as IndexingQuota,
        recent_requests: (requests || []) as IndexingRequest[],
        reset_at: new Date().toISOString(),
        breakdown: data.aggregated_quota.breakdown,
      };
    },
    enabled: !!siteId,
    refetchInterval: 10000, // Refetch a cada 10 segundos para updates mais rápidos
  });

  // Request indexing mutation (agora sem integration_id - sistema escolhe automaticamente)
  const requestIndexing = useMutation({
    mutationFn: async ({ 
      url, 
      page_id,
      request_type = 'URL_UPDATED' 
    }: { 
      url: string; 
      page_id?: string;
      request_type?: 'URL_UPDATED' | 'URL_DELETED';
    }) => {
      if (!siteId) throw new Error('No site selected');

      console.log('📤 Requesting indexing for URL:', url);

      const { data, error } = await supabase.functions.invoke('gsc-request-indexing', {
        body: {
          site_id: siteId,
          url,
          page_id,
          request_type,
        },
      });

      if (error) {
        console.error('❌ Error requesting indexing:', error);
        throw new Error(error.message || 'Failed to request indexing');
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "URL enviada para indexação!",
        description: `Google Search Console receberá a solicitação em breve. Quota restante: ${data.quota.remaining}/${data.quota.limit}`,
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site-pages', siteId] });
      refetchQuota();
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      
      // Detectar erro de API desabilitada
      if (errorMessage.includes('Web Search Indexing API has not been used') || 
          errorMessage.includes('SERVICE_DISABLED') ||
          errorMessage.includes('API not enabled') ||
          errorMessage.includes('PERMISSION_DENIED')) {
        toast({
          title: "⚠️ API do Google não habilitada",
          description: "Você precisa ativar a Web Search Indexing API no Google Cloud Console. Acesse: APIs & Serviços → Biblioteca → Web Search Indexing API",
          variant: "destructive",
          duration: 10000,
        });
      } else if (errorMessage.includes('Daily quota exceeded')) {
        toast({
          title: "❌ Quota diária excedida",
          description: "Você atingiu o limite de 200 URLs por integração hoje. Tente novamente amanhã ou adicione mais integrações GSC.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('recently indexed') || errorMessage.includes('already indexed in the last 24 hours')) {
        toast({
          title: "ℹ️ URL já foi indexada recentemente",
          description: "Esta URL foi submetida para indexação nas últimas 24 horas. Aguarde antes de tentar novamente.",
        });
      } else {
        toast({
          title: "Erro ao solicitar indexação",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  return {
    quota: quotaData?.quota || null,
    recentRequests: quotaData?.recent_requests || [],
    resetAt: quotaData?.reset_at || null,
    isLoadingQuota,
    requestIndexing,
    isRequesting: requestIndexing.isPending,
    refetchQuota,
  };
}

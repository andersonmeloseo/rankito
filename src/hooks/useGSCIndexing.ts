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
  integrationId: string | null;
}

export function useGSCIndexing({ integrationId }: UseGSCIndexingParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quota
  const { data: quotaData, isLoading: isLoadingQuota, refetch: refetchQuota } = useQuery({
    queryKey: ['gsc-quota', integrationId],
    queryFn: async () => {
      if (!integrationId) return null;

      console.log('🔍 Fetching GSC quota for integration:', integrationId);

      const { data, error } = await supabase.functions.invoke('gsc-get-quota', {
        body: { integration_id: integrationId },
      });

      if (error) {
        console.error('❌ Error fetching quota:', error);
        throw new Error(error.message || 'Failed to fetch quota');
      }

      console.log('✅ Quota fetched:', data.quota);
      return {
        quota: data.quota as IndexingQuota,
        recent_requests: data.recent_requests as IndexingRequest[],
        reset_at: data.reset_at as string,
      };
    },
    enabled: !!integrationId,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  // Request indexing mutation
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
      if (!integrationId) throw new Error('No integration selected');

      console.log('📤 Requesting indexing for URL:', url);

      const { data, error } = await supabase.functions.invoke('gsc-request-indexing', {
        body: {
          integration_id: integrationId,
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
      queryClient.invalidateQueries({ queryKey: ['gsc-quota', integrationId] });
      refetchQuota();
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      
      if (errorMessage.includes('Daily quota exceeded')) {
        toast({
          title: "Limite diário atingido",
          description: "Você atingiu o limite de 200 URLs por dia. Tente novamente amanhã.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('recently indexed')) {
        toast({
          title: "URL já indexada recentemente",
          description: "Esta URL já foi indexada nas últimas 24 horas.",
          variant: "destructive",
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

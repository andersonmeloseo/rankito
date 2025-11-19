import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGSCSmartDistribution } from "./useGSCSmartDistribution";

interface QueueItem {
  id: string;
  integration_id: string;
  page_id: string | null;
  url: string;
  status: string;
  scheduled_for: string;
  attempts: number;
  error_message: string | null;
  batch_id: string | null;
  created_at: string;
  processed_at: string | null;
}

interface Batch {
  id: string;
  integration_id: string;
  total_urls: number;
  completed_urls: number;
  failed_urls: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface UseGSCIndexingQueueParams {
  siteId: string | null;
}

export function useGSCIndexingQueue({ siteId }: UseGSCIndexingQueueParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { distributeUrls } = useGSCSmartDistribution(siteId || '');

  // Fetch queue items (agregado de todas integrações do site) - Limitado a 100 para performance
  const { data: queueData, isLoading: isLoadingQueue } = useQuery({
    queryKey: ['gsc-indexing-queue', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const { data, error } = await supabase
        .from('gsc_indexing_queue')
        .select('*, google_search_console_integrations!inner(site_id, connection_name)')
        .eq('google_search_console_integrations.site_id', siteId)
        .order('scheduled_for', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1000); // Limit to 1000 items for better visibility

      if (error) throw new Error(error.message);

      return data as QueueItem[];
    },
    enabled: !!siteId,
    refetchInterval: (query) => {
      // ⚡ Refetch dinâmico baseado no estado da fila
      const data = query.state.data;
      if (!data || data.length === 0) return 60000; // 60s quando vazia
      
      const hasPending = data.some(item => item.status === 'pending');
      return hasPending ? 15000 : 30000; // 15s se pendente, 30s se não
    },
  });

  // Fetch batches (agregado de todas integrações do site)
  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['gsc-indexing-batches', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const { data, error } = await supabase
        .from('gsc_indexing_batches')
        .select('*, google_search_console_integrations!inner(site_id, connection_name)')
        .eq('google_search_console_integrations.site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);

      return data as Batch[];
    },
    enabled: !!siteId,
    refetchInterval: (query) => {
      // ⚡ Refetch dinâmico baseado no estado dos batches
      const data = query.state.data;
      if (!data || data.length === 0) return 60000; // 60s quando vazio
      
      const hasActive = data.some(batch => 
        batch.status === 'processing' || batch.status === 'queued'
      );
      return hasActive ? 10000 : 30000; // 10s se ativo, 30s se não
    },
  });

  // Add URLs to queue mutation (usa distribuição inteligente)
  const addToQueue = useMutation({
    mutationFn: async ({
      urls,
    }: {
      urls: { url: string; page_id?: string }[];
      distribution?: 'fast' | 'even'; // Mantido para compatibilidade, mas não usado
    }) => {
      if (!siteId) throw new Error('No site selected');

      console.log(`📤 Adicionando ${urls.length} URLs à fila usando distribuição inteligente`);

      // Atualizar status GSC das páginas para "submitted" ANTES de distribuir
      const pageIds = urls
        .map(u => u.page_id)
        .filter(Boolean);
      
      if (pageIds.length > 0) {
        await supabase
          .from('rank_rent_pages')
          .update({ 
            gsc_indexation_status: 'submitted',
            gsc_last_checked_at: new Date().toISOString()
          })
          .in('id', pageIds);
      }

      // Usar distribuição inteligente diretamente
      // Nota: distributeUrls já exibe seu próprio toast de sucesso com detalhes da distribuição
      await distributeUrls({ siteId, urls });

      // Retornar formato compatível para onSuccess (mesmo que não seja usado)
      return { 
        totalUrls: urls.length,
        success: true
      };
    },
    onSuccess: () => {
      // O toast já é exibido pelo useGSCSmartDistribution, então só invalidamos as queries
      queryClient.invalidateQueries({ queryKey: ['site-pages', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-pending-count', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-batches', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site-pages', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-pending-count', siteId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar à fila",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel batch mutation
  const cancelBatch = useMutation({
    mutationFn: async (batchId: string) => {
      // Atualizar status do batch
      const { error: batchError } = await supabase
        .from('gsc_indexing_batches')
        .update({ status: 'cancelled' })
        .eq('id', batchId);

      if (batchError) throw new Error(batchError.message);

      // Remover URLs pendentes da fila
      const { error: queueError } = await supabase
        .from('gsc_indexing_queue')
        .delete()
        .eq('batch_id', batchId)
        .eq('status', 'pending');

      if (queueError) throw new Error(queueError.message);
    },
    onSuccess: () => {
      toast({
        title: "Batch cancelado",
        description: "As URLs pendentes foram removidas da fila.",
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-batches', siteId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar batch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove single URL from queue
  const removeFromQueue = useMutation({
    mutationFn: async (queueItemId: string) => {
      const { error } = await supabase
        .from('gsc_indexing_queue')
        .delete()
        .eq('id', queueItemId)
        .eq('status', 'pending');

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({
        title: "URL removida da fila",
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover URL",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear all pending URLs from queue
  const clearAllPendingUrls = useMutation({
    mutationFn: async () => {
      if (!siteId) throw new Error('No site selected');

      // Buscar todas integrações do site
      const { data: integrations } = await supabase
        .from('google_search_console_integrations')
        .select('id')
        .eq('site_id', siteId);

      if (!integrations || integrations.length === 0) {
        throw new Error('Nenhuma integração encontrada');
      }

      const integrationIds = integrations.map(i => i.id);

      // Deletar todas URLs pendentes dessas integrações
      const { data, error } = await supabase
        .from('gsc_indexing_queue')
        .delete()
        .in('integration_id', integrationIds)
        .eq('status', 'pending')
        .select('id');

      if (error) throw error;
      
      return { removedCount: data?.length || 0 };
    },
    onSuccess: (data) => {
      toast({
        title: "Fila limpa com sucesso!",
        description: `${data.removedCount} URLs pendentes foram removidas.`,
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-batches', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao limpar fila",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate queue stats
  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();
  
  const queueStats = {
    total: queueData?.length || 0,
    pending: queueData?.filter(item => item.status === 'pending').length || 0,
    processing: queueData?.filter(item => item.status === 'processing').length || 0,
    completed: queueData?.filter(item => item.status === 'completed').length || 0,
    failed: queueData?.filter(item => item.status === 'failed').length || 0,
    pendingToday: queueData?.filter(item => 
      item.status === 'pending' && 
      new Date(item.scheduled_for).toDateString() === today
    ).length || 0,
    pendingTomorrow: queueData?.filter(item => 
      item.status === 'pending' && 
      new Date(item.scheduled_for).toDateString() === tomorrow
    ).length || 0,
  };

  return {
    queueItems: queueData || [],
    batches: batchesData || [],
    queueStats,
    isLoadingQueue,
    isLoadingBatches,
    addToQueue,
    cancelBatch,
    removeFromQueue,
    clearAllPendingUrls,
    isAddingToQueue: addToQueue.isPending,
  };
}

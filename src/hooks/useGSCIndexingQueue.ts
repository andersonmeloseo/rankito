import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  integrationId: string | null;
}

export function useGSCIndexingQueue({ integrationId }: UseGSCIndexingQueueParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch queue items
  const { data: queueData, isLoading: isLoadingQueue } = useQuery({
    queryKey: ['gsc-indexing-queue', integrationId],
    queryFn: async () => {
      if (!integrationId) return null;

      const { data, error } = await supabase
        .from('gsc_indexing_queue')
        .select('*')
        .eq('integration_id', integrationId)
        .order('scheduled_for', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);

      return data as QueueItem[];
    },
    enabled: !!integrationId,
    refetchInterval: 10000, // Refetch a cada 10 segundos
  });

  // Fetch batches
  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['gsc-indexing-batches', integrationId],
    queryFn: async () => {
      if (!integrationId) return null;

      const { data, error } = await supabase
        .from('gsc_indexing_batches')
        .select('*')
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw new Error(error.message);

      return data as Batch[];
    },
    enabled: !!integrationId,
    refetchInterval: 10000,
  });

  // Add URLs to queue mutation
  const addToQueue = useMutation({
    mutationFn: async ({
      urls,
      distribution,
    }: {
      urls: { url: string; page_id?: string }[];
      distribution: 'fast' | 'even';
    }) => {
      if (!integrationId) throw new Error('No integration selected');

      // Criar batch
      const { data: batch, error: batchError } = await supabase
        .from('gsc_indexing_batches')
        .insert({
          integration_id: integrationId,
          total_urls: urls.length,
          status: 'pending',
        })
        .select()
        .single();

      if (batchError) throw new Error(batchError.message);

      // Calcular datas de agendamento
      const today = new Date();
      const queueItems = urls.map((item, index) => {
        let scheduledDate = new Date(today);

        if (distribution === 'even') {
          // Distribuir uniformemente: 200 URLs por dia
          const dayOffset = Math.floor(index / 200);
          scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
        }
        // Se 'fast', todas as URLs são agendadas para hoje

        return {
          integration_id: integrationId,
          page_id: item.page_id || null,
          url: item.url,
          scheduled_for: scheduledDate.toISOString().split('T')[0],
          batch_id: batch.id,
          status: 'pending',
        };
      });

      // Inserir na fila
      const { error: queueError } = await supabase
        .from('gsc_indexing_queue')
        .insert(queueItems);

      if (queueError) throw new Error(queueError.message);

      return { batch, totalUrls: urls.length };
    },
    onSuccess: (data) => {
      toast({
        title: "URLs adicionadas à fila!",
        description: `${data.totalUrls} URLs foram agendadas para indexação.`,
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', integrationId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-batches', integrationId] });
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
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', integrationId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-batches', integrationId] });
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
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', integrationId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover URL",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate queue stats
  const queueStats = {
    total: queueData?.length || 0,
    pending: queueData?.filter(item => item.status === 'pending').length || 0,
    processing: queueData?.filter(item => item.status === 'processing').length || 0,
    completed: queueData?.filter(item => item.status === 'completed').length || 0,
    failed: queueData?.filter(item => item.status === 'failed').length || 0,
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
    isAddingToQueue: addToQueue.isPending,
  };
}

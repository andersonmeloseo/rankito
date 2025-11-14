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
  siteId: string | null;
}

export function useGSCIndexingQueue({ siteId }: UseGSCIndexingQueueParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        .limit(100); // Limit to 100 most recent items for performance

      if (error) throw new Error(error.message);

      return data as QueueItem[];
    },
    enabled: !!siteId,
    refetchInterval: 10000, // Refetch a cada 10 segundos
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
    refetchInterval: 10000,
  });

  // Add URLs to queue mutation (agora usa site_id e distribui entre integrações automaticamente)
  const addToQueue = useMutation({
    mutationFn: async ({
      urls,
      distribution,
    }: {
      urls: { url: string; page_id?: string }[];
      distribution: 'fast' | 'even';
    }) => {
      if (!siteId) throw new Error('No site selected');

      // Buscar todas integrações ativas do site
      const { data: integrations, error: intError } = await supabase
        .from('google_search_console_integrations')
        .select('id')
        .eq('site_id', siteId)
        .eq('is_active', true);

      if (intError || !integrations || integrations.length === 0) {
        throw new Error('Nenhuma integração ativa encontrada para este site');
      }

      // Escolher primeira integração (ou implementar round-robin)
      const integrationId = integrations[0].id;

      // Verificar URLs duplicadas já na fila
      const { data: existingQueue } = await supabase
        .from('gsc_indexing_queue')
        .select('url, integration_id, scheduled_for')
        .in('url', urls.map(u => u.url))
        .eq('integration_id', integrationId)
        .in('status', ['pending', 'processing']);

      // Calcular data de agendamento para comparação
      const today = new Date();
      const scheduledDate = today.toISOString().split('T')[0];

      // Filtrar URLs que já existem na fila
      const uniqueUrls = urls.filter(u => 
        !existingQueue?.some(eq => 
          eq.url === u.url && 
          eq.integration_id === integrationId &&
          (distribution === 'fast' ? eq.scheduled_for === scheduledDate : true)
        )
      );

      // Se todas as URLs foram filtradas
      if (uniqueUrls.length === 0) {
        throw new Error('Todas as URLs já estão na fila de indexação');
      }

      // Criar batch
      const { data: batch, error: batchError } = await supabase
        .from('gsc_indexing_batches')
        .insert({
          integration_id: integrationId,
          total_urls: uniqueUrls.length,
          status: 'pending',
        })
        .select()
        .single();

      if (batchError) throw new Error(batchError.message);

      // Calcular datas de agendamento
      const queueItems = uniqueUrls.map((item, index) => {
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

      // Atualizar status GSC das páginas para "submitted"
      const pageIds = uniqueUrls
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

      return { 
        batch, 
        totalUrls: uniqueUrls.length,
        duplicateCount: urls.length - uniqueUrls.length,
        originalCount: urls.length
      };
    },
    onSuccess: (data) => {
      const hasWarnings = data.duplicateCount > 0;
      
      toast({
        title: hasWarnings ? "URLs adicionadas com avisos" : "URLs adicionadas à fila!",
        description: hasWarnings
          ? `${data.totalUrls} URLs adicionadas, ${data.duplicateCount} já estavam na fila`
          : `${data.totalUrls} URLs foram agendadas para indexação.`,
        variant: hasWarnings ? "default" : "default",
      });
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
    clearAllPendingUrls,
    isAddingToQueue: addToQueue.isPending,
  };
}

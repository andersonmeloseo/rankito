import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGSCSmartDistribution } from './useGSCSmartDistribution';

interface RebalanceResult {
  message: string;
  urlsRebalanced: number;
}

/**
 * Hook para rebalancear fila de indexação usando distribuição inteligente
 * Remove todas URLs pendentes e as redistribui usando algoritmo greedy
 */
export function useGSCQueueRebalance(siteId: string) {
  const queryClient = useQueryClient();
  const { distributeUrls } = useGSCSmartDistribution(siteId);

  const rebalanceQueue = useMutation({
    mutationFn: async (): Promise<RebalanceResult> => {
      console.log('🔄 Iniciando rebalanceamento da fila para site:', siteId);

      // 1. Buscar todas URLs pendentes na fila deste site
      const { data: queueItems, error: fetchError } = await supabase
        .from('gsc_indexing_queue')
        .select('id, url, page_id, integration_id, google_search_console_integrations!inner(site_id)')
        .eq('google_search_console_integrations.site_id', siteId)
        .eq('status', 'pending');

      if (fetchError) {
        console.error('❌ Erro ao buscar URLs pendentes:', fetchError);
        throw new Error(`Erro ao buscar URLs: ${fetchError.message}`);
      }

      if (!queueItems || queueItems.length === 0) {
        console.log('ℹ️ Nenhuma URL pendente para rebalancear');
        return { 
          message: 'Nenhuma URL pendente para rebalancear', 
          urlsRebalanced: 0 
        };
      }

      console.log(`📊 Encontradas ${queueItems.length} URLs pendentes para rebalancear`);

      // 2. Deletar URLs da fila atual
      const urlIds = queueItems.map(item => item.id);
      const { error: deleteError } = await supabase
        .from('gsc_indexing_queue')
        .delete()
        .in('id', urlIds);

      if (deleteError) {
        console.error('❌ Erro ao limpar fila:', deleteError);
        throw new Error(`Erro ao limpar fila: ${deleteError.message}`);
      }

      console.log('✅ Fila antiga limpa, redistribuindo URLs...');

      // 3. Re-adicionar usando distribuição inteligente
      const urls = queueItems.map(item => ({
        url: item.url,
        page_id: item.page_id || undefined,
      }));

      // Chamar distribuição inteligente
      await distributeUrls({ siteId, urls });

      console.log('✅ Rebalanceamento concluído com sucesso');

      return {
        message: `${queueItems.length} URLs rebalanceadas com sucesso`,
        urlsRebalanced: queueItems.length,
      };
    },
    onSuccess: (result) => {
      toast.success('Fila Rebalanceada! 🎯', {
        description: result.message,
        duration: 5000,
      });
      
      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-load-distribution', siteId] });
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao rebalancear fila:', error);
      toast.error('Erro ao rebalancear fila', {
        description: error.message,
        duration: 5000,
      });
    },
  });

  return {
    rebalanceQueue: rebalanceQueue.mutate,
    isRebalancing: rebalanceQueue.isPending,
  };
}

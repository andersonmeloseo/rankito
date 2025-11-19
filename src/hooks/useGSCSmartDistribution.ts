import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAggregatedGSCQuota } from './useAggregatedGSCQuota';
import { distributeUrls, validateDistribution, previewDistribution, type Integration, type DistributionPreview } from '@/lib/gsc-distribution-engine';
import { createLogger, Logger } from '@/lib/logger';
import { useState } from 'react';

const logger = createLogger({ operation: 'smart-distribution' });

interface DistributeUrlsParams {
  siteId: string;
  urls: Array<{ url: string; page_id?: string }>;
}

interface DistributionResult {
  success: boolean;
  total_urls: number;
  queued_urls: number;
  skipped_urls: number;
  distribution: Record<string, number>;
  message: string;
  days_needed: number;
}

/**
 * Hook para distribuição inteligente de URLs entre integrações GSC
 * Usa engine centralizado para distribuição consistente
 */
export function useGSCSmartDistribution(siteId: string) {
  const queryClient = useQueryClient();
  const { data: quota } = useAggregatedGSCQuota({ siteId });
  const [preview, setPreview] = useState<DistributionPreview | null>(null);

  const distributeUrlsMutation = useMutation({
    mutationFn: async ({ siteId, urls }: DistributeUrlsParams): Promise<DistributionResult> => {
      const correlationId = Logger.generateCorrelationId();
      const log = logger.child({ correlationId, siteId });

      console.log(`🚀 [useGSCSmartDistribution] INÍCIO - ${urls.length} URLs para site ${siteId}`);
      log.info(`Iniciando distribuição: ${urls.length} URLs`);

      if (!quota) {
        console.error(`❌ [useGSCSmartDistribution] Quota não disponível`);
        throw new Error('Dados de quota não disponíveis. Verifique se há integrações GSC configuradas.');
      }

      console.log(`📋 [useGSCSmartDistribution] Quota recebida:`, {
        total_integrations: quota.breakdown?.length || 0,
        total_limit: quota.total_limit,
        total_remaining: quota.total_remaining
      });

      // Converter integrações para formato do engine COM FALLBACK
      const integrations: Integration[] = (quota.breakdown || [])
        .filter(i => {
          const isHealthy = i.health_status === 'healthy' || i.health_status === null;
          console.log(`  🏥 Integração ${i.name}: health=${i.health_status}, remaining=${i.remaining}, healthy=${isHealthy}`);
          return isHealthy;
        })
        .map(i => ({
          integration_id: i.integration_id,
          name: i.name,
          email: i.email,
          remaining_today: Math.max(0, i.remaining), // GARANTIR NUNCA NEGATIVO
          daily_limit: i.limit,
          is_active: true,
          health_status: i.health_status,
          consecutive_failures: 0,
        }));

      console.log(`✅ [useGSCSmartDistribution] ${integrations.length} integrações saudáveis encontradas`);

      if (integrations.length === 0) {
        console.error(`❌ [useGSCSmartDistribution] ZERO integrações saudáveis!`);
        throw new Error('Nenhuma integração GSC saudável disponível. Adicione ou repare suas integrações.');
      }

      // Validar distribuição
      console.log(`🔍 [useGSCSmartDistribution] Validando distribuição...`);
      const validation = validateDistribution(urls, integrations);
      
      console.log(`📊 [useGSCSmartDistribution] Resultado validação:`, validation);
      
      if (!validation.valid) {
        console.error(`❌ [useGSCSmartDistribution] Validação falhou: ${validation.error}`);
        throw new Error(validation.error);
      }

      // Executar distribuição usando engine
      console.log(`⚙️ [useGSCSmartDistribution] Executando distribuição greedy...`);
      const result = distributeUrls(urls, integrations, 'greedy');

      console.log(`✅ [useGSCSmartDistribution] Distribuição calculada:`, {
        queueItems: result.queueItems.length,
        daysNeeded: result.daysNeeded,
        distribution: result.distribution
      });

      log.info(`Distribuição calculada: ${result.queueItems.length} URLs em ${result.daysNeeded} dias`);

      if (result.queueItems.length === 0) {
        console.error(`❌ [useGSCSmartDistribution] Engine retornou 0 items!`);
        throw new Error('Engine de distribuição não gerou nenhum item. Contate o suporte.');
      }

      // Buscar URLs já existentes na fila para evitar duplicatas
      console.log(`🔍 [useGSCSmartDistribution] Verificando URLs já existentes na fila...`);
      
      const integrationIds = [...new Set(result.queueItems.map(item => item.integration_id))];
      const { data: existingUrls, error: fetchError } = await supabase
        .from('gsc_indexing_queue')
        .select('url, integration_id')
        .in('integration_id', integrationIds)
        .in('status', ['pending', 'processing']);

      if (fetchError) {
        console.error(`❌ [useGSCSmartDistribution] Erro ao buscar URLs existentes:`, fetchError);
      }

      // Criar Set de URLs duplicadas (url + integration_id)
      const existingUrlKeys = new Set(
        (existingUrls || []).map(item => `${item.url}|||${item.integration_id}`)
      );

      console.log(`📊 [useGSCSmartDistribution] URLs já na fila: ${existingUrlKeys.size}`);

      // Filtrar apenas URLs novas
      const newQueueItems = result.queueItems.filter(item => {
        const key = `${item.url}|||${item.integration_id}`;
        return !existingUrlKeys.has(key);
      });

      const duplicatesCount = result.queueItems.length - newQueueItems.length;
      if (duplicatesCount > 0) {
        console.warn(`⚠️ [useGSCSmartDistribution] ${duplicatesCount} URLs duplicadas removidas`);
      }

      if (newQueueItems.length === 0) {
        console.warn(`⚠️ [useGSCSmartDistribution] Todas as URLs já estão na fila!`);
        return {
          success: true,
          total_urls: urls.length,
          queued_urls: 0,
          skipped_urls: urls.length,
          distribution: {},
          days_needed: 0,
          message: 'Todas as URLs já foram enviadas anteriormente'
        };
      }

      // Inserir apenas URLs novas
      console.log(`💾 [useGSCSmartDistribution] Inserindo ${newQueueItems.length} items novos no banco...`);
      console.log(`📋 [useGSCSmartDistribution] Primeiros 3 items:`, newQueueItems.slice(0, 3));

      const { data: insertedData, error: insertError } = await supabase
        .from('gsc_indexing_queue')
        .insert(newQueueItems)
        .select();

      if (insertError) {
        console.error(`❌ [useGSCSmartDistribution] ERRO AO INSERIR:`, {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        log.error('Erro ao inserir na fila', insertError);
        
        // Identificar duplicatas (constraint violation)
        if (insertError.code === '23505') {
          throw new Error(`Algumas URLs já foram enviadas hoje para estas integrações. Tente novamente amanhã ou use outras integrações.`);
        }
        
        throw new Error(`Erro ao adicionar URLs à fila: ${insertError.message}`);
      }

      // Validar inserção real
      const insertedCount = insertedData?.length || 0;
      console.log(`📊 [useGSCSmartDistribution] URLs inseridas: ${insertedCount}/${result.queueItems.length}`);

      if (insertedCount === 0) {
        console.error(`❌ [useGSCSmartDistribution] ZERO URLs inseridas! Testando RLS...`);
        
        // Fazer query de teste para diagnosticar RLS
        const { count, error: testError } = await supabase
          .from('gsc_indexing_queue')
          .select('*', { count: 'exact', head: true })
          .eq('integration_id', result.queueItems[0].integration_id);

        console.log(`🧪 [useGSCSmartDistribution] Teste RLS: count=${count}, error=`, testError);
        
        throw new Error('Nenhuma URL foi adicionada. Possível problema de permissão (RLS). Contate o suporte.');
      }

      if (insertedCount < result.queueItems.length) {
        console.warn(`⚠️ [useGSCSmartDistribution] Inserção parcial: ${insertedCount}/${result.queueItems.length}`);
        log.warn(`⚠️ Apenas ${insertedCount} de ${result.queueItems.length} URLs foram inseridas`);
      }

      console.log(`🎉 [useGSCSmartDistribution] SUCESSO TOTAL!`);
      log.info('Distribuição concluída com sucesso');

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-load-distribution', siteId] });

      const skippedCount = result.queueItems.length - newQueueItems.length;
      
      return {
        success: true,
        total_urls: urls.length,
        queued_urls: newQueueItems.length,
        skipped_urls: skippedCount,
        distribution: result.distribution,
        days_needed: result.daysNeeded,
        message: result.daysNeeded === 1 
          ? `${newQueueItems.length} URLs agendadas para HOJE usando ${Object.keys(result.distribution).length} contas`
          : `${newQueueItems.length} URLs distribuídas inteligentemente em ${result.daysNeeded} dia(s)`,
      };
    },
    onSuccess: (result) => {
      const distributionDetails = Object.entries(result.distribution)
        .map(([name, count]) => `• ${name}: ${count} URLs`)
        .join('\n');

      const skippedUrls = result.total_urls - result.queued_urls;
      const skippedInfo = skippedUrls > 0 ? `\n\n⚠️ ${skippedUrls} URLs duplicadas foram ignoradas` : '';
      
      const description = `📊 Distribuição por conta:\n${distributionDetails}\n\n⏰ URLs serão enviadas em ${result.days_needed} dia(s)${skippedInfo}`;

      toast.success(result.message, {
        description,
        duration: 8000,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na distribuição de URLs', {
        description: error.message,
        duration: 5000,
      });
    },
  });

  const generatePreview = async (urls: Array<{ url: string; page_id?: string }>) => {
    const log = logger.child({ siteId, operation: 'preview-distribution' });
    
    try {
      log.info('Generating distribution preview', { urlCount: urls.length });

      if (!quota) {
        throw new Error('Quota data not available');
      }

      const integrations: Integration[] = quota.breakdown
        .filter(i => i.health_status === 'healthy' || !i.health_status)
        .map(i => ({
          integration_id: i.integration_id,
          name: i.name,
          email: i.email,
          remaining_today: i.remaining,
          daily_limit: i.limit,
          is_active: true,
          health_status: i.health_status,
          consecutive_failures: 0,
        }));

      const preview = previewDistribution(urls, integrations, 'greedy');
      setPreview(preview);
      
      log.info('Preview generated', { 
        daysNeeded: preview.daysNeeded,
        accountsUsed: preview.summary.accountsUsed 
      });

      return preview;
    } catch (error) {
      log.error('Failed to generate preview', error);
      throw error;
    }
  };

  // Distribuição manual: Usuário escolhe quais contas e quantas URLs por conta
  const distributeUrlsManualMutation = useMutation({
    mutationFn: async ({ 
      siteId, 
      urls, 
      manualDistribution 
    }: {
      siteId: string;
      urls: Array<{ url: string; page_id?: string }>;
      manualDistribution: Record<string, number>; // integration_id -> qtd URLs
    }): Promise<DistributionResult> => {
      const correlationId = Logger.generateCorrelationId();
      const log = logger.child({ correlationId, siteId });

      log.info(`Iniciando distribuição manual: ${urls.length} URLs`, { distribution: manualDistribution });

      const queueItems: any[] = [];
      const urlsCopy = [...urls];
      const today = new Date().toISOString().split('T')[0];
      
      // Criar queue items baseado na distribuição manual
      for (const [integrationId, count] of Object.entries(manualDistribution)) {
        if (count > 0) {
          const urlsForThisIntegration = urlsCopy.splice(0, count);
          
          urlsForThisIntegration.forEach(({ url, page_id }) => {
            queueItems.push({
              integration_id: integrationId,
              url,
              page_id: page_id || null,
              scheduled_for: today,
              status: 'pending',
            });
          });
        }
      }

      log.info(`Distribuição manual calculada: ${queueItems.length} URLs`);

      // Inserir em lote na fila
      const { error: insertError } = await supabase
        .from('gsc_indexing_queue')
        .insert(queueItems);

      if (insertError) {
        log.error('Erro ao inserir na fila', insertError);
        throw new Error(`Erro ao adicionar URLs à fila: ${insertError.message}`);
      }

      log.info('Distribuição manual concluída com sucesso');

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-load-distribution', siteId] });

      // Contar URLs por nome de integração para o resumo
      const distribution: Record<string, number> = {};
      if (quota) {
        Object.entries(manualDistribution).forEach(([integrationId, count]) => {
          const integration = quota.breakdown.find(i => i.integration_id === integrationId);
          if (integration) {
            distribution[integration.name] = count;
          }
        });
      }

      return {
        success: true,
        total_urls: urls.length,
        queued_urls: queueItems.length,
        skipped_urls: 0,
        distribution,
        days_needed: 1,
        message: `${urls.length} URLs distribuídas manualmente em ${Object.keys(manualDistribution).length} conta(s)`,
      };
    },
    onSuccess: (result) => {
      const distributionDetails = Object.entries(result.distribution)
        .map(([name, count]) => `• ${name}: ${count} URLs`)
        .join('\n');

      const description = `📊 Distribuição manual:\n${distributionDetails}`;

      toast.success(result.message, {
        description,
        duration: 8000,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na distribuição manual de URLs', {
        description: error.message,
        duration: 5000,
      });
    },
  });

  return {
    distributeUrls: distributeUrlsMutation.mutate,
    distributeUrlsManual: distributeUrlsManualMutation.mutate,
    isDistributing: distributeUrlsMutation.isPending || distributeUrlsManualMutation.isPending,
    result: distributeUrlsMutation.data,
    generatePreview,
    preview,
  };
}

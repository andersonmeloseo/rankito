import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Conversion {
  id: string;
  site_id: string;
  page_id: string | null;
  event_type: string;
  page_url: string;
  page_path: string;
  cta_text: string | null;
  created_at: string;
  metadata: any;
}

interface UseRealtimeConversionsReturn {
  newConversions: Conversion[];
  liveCount: number;
  isConnected: boolean;
  totalConversionsToday: number;
  clearNewConversions: () => void;
}

export const useRealtimeConversions = (
  siteIds: string[] | undefined,
  onNewConversion?: (conversion: Conversion) => void
): UseRealtimeConversionsReturn => {
  const [newConversions, setNewConversions] = useState<Conversion[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [totalConversionsToday, setTotalConversionsToday] = useState(0);

  const clearNewConversions = useCallback(() => {
    setNewConversions([]);
  }, []);

  useEffect(() => {
    if (!siteIds || siteIds.length === 0) {
      return;
    }

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      try {
        // Buscar conversões de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: todayConversions } = await supabase
          .from('rank_rent_conversions')
          .select('id')
          .in('site_id', siteIds)
          .gte('created_at', today.toISOString());

        setTotalConversionsToday(todayConversions?.length || 0);

        // Configurar canal de realtime
        channel = supabase
          .channel('conversions-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'rank_rent_conversions',
              filter: `site_id=in.(${siteIds.join(',')})`,
            },
            (payload) => {
              console.log('🆕 Nova conversão recebida:', payload);
              
              const newConversion = payload.new as Conversion;
              
              setNewConversions((prev) => {
                // Manter apenas últimas 50 conversões em memória
                const updated = [newConversion, ...prev].slice(0, 50);
                return updated;
              });

              setTotalConversionsToday((prev) => prev + 1);

              // Callback para notificações
              if (onNewConversion) {
                onNewConversion(newConversion);
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Status da conexão realtime:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

        console.log('✅ Realtime configurado para sites:', siteIds);
      } catch (error) {
        console.error('❌ Erro ao configurar realtime:', error);
        setIsConnected(false);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        console.log('🔌 Desconectando realtime...');
        supabase.removeChannel(channel);
      }
    };
  }, [siteIds, onNewConversion]);

  return {
    newConversions,
    liveCount: newConversions.length,
    isConnected,
    totalConversionsToday,
    clearNewConversions,
  };
};
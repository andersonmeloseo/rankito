import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealtimeLead {
  id: string;
  title: string;
  lead_score: number;
  stage: string;
  source: string;
  created_at: string;
}

export const useRealtimeLeads = (userId: string | undefined) => {
  const [newLeads, setNewLeads] = useState<RealtimeLead[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // 🔥 Usar ref para toast estável
  const toastRef = useRef(toast);
  
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    if (!userId) return;

    console.log('🔔 Setting up realtime leads subscription...');

    // 🔥 Nome único de canal para evitar conflitos
    const channelName = `leads-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_deals',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🆕 New lead detected:', payload);
          
          const newLead = payload.new as RealtimeLead;
          
          // Adicionar à lista de novos leads
          setNewLeads((prev) => [newLead, ...prev].slice(0, 5)); // Manter apenas últimos 5

          // Determinar emoji baseado no score
          const emoji = newLead.lead_score >= 80 ? '🔥' : newLead.lead_score >= 60 ? '⚡' : '❄️';
          
          // 🔥 Mostrar toast usando ref
          toastRef.current({
            title: `${emoji} Novo Lead Capturado!`,
            description: newLead.title,
            duration: 8000,
          });

          // Tocar som (opcional)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m96+SaSwkNUKrk5rRlHQU2kdv00oAqBiVzxe/ekTsNFmG28O6iVhQIR5/h9L5sIgQqgM7z2oo5CBtpvevkmk0JDVGs5fKxYh0EOpLb9NGAKQYlcsTv35E6DRZhtvD5ol0VB0af4PK+ayIEKoDO89qKOggdabzr5JpNCQ1QrOXysWIeBDqR2/TRgCkGJHLE79+ROQ0WYbbx+qJeFQdGn+H0vmshBCmAzvPbizwJHWm86+SaTQkOUK3m8rBhHgQ7kdv00YApBiRyxO/fkTkNFmG28fqiXhUHRp/h9L9sIgQpgM7z24s8CR1pvOvkmUwJDlCt5vKwYR4EOpHb9NGAKQYkcsTv4JE5DRVhtfH6ol4VB0af4fS+ayIFKYDO89uLPAkdabzr5JlMCQ5QrebysGEeBDuR2/TRgCkGJXLE7+CROw0VYbXx+qJdFQdGn+H1vmsiBSmAzvPbizwJHWm86+SZTAkOUK3m8rBhHgQ7kdv00YApBiRyxO/hkTsNFWG18fqiXRUHRp/h9b9rIgUpgM7z24s9CR1pvOvkmUwJDlCt5vKwYh4EOpHb9NGAKgYkcsTv4JE7DRVhtfH6ol0VB0af4fS/aiIFKYDO89uLPQkdabzr5JlMCQ9QrebysGEeBDqS2/TRgCkGJHLE7+CROw0WYbXx+qJdFQdGn+H0v2oiBSmAzvPbiz0JHWm86+SZTAkPUK3m8rBhHgQ6ktv10YApBiRzxO/hkTsNFWG18fqiXRUHRp/h9L9qIgUpgM7z24s9CR1pvOvkmUwJD1Ct5vKwYh4EOpLb9dGAKQYkc8Tv4ZE7DRVhtfH6ol0VB0af4PO+ayIFKYDO89uMPQkdabzr5JlMCQ9QrebysGEeBDqS2/XSgCoGJHPF7+GROw0WYbXx+qNeFQdGn+D0vmshBCmAzvPbjD0JHWm86+WaTAkPUK3m8rBhHgQ7ktv10oApBiR0xe/hkTsNFWK18fuiXRUHRp/g9L5rIQQpgM7z24w9CR1pvOvlmkwJD1Ct5vKwYR4EO5Lb9dKAKQYkdMXv4ZE7DRVitfH7ol0VB0af4PS+ayEEKYDO89uMPQkdabzr5ZpMCQ9QrebysGEeBDuS2/XRgCkGJHTF7+GROw0VYrXx+6JdFQdGn+D0vmshBCmAzvPbjD0JHWm86+WaTAkPUK3m8rBhHgQ7ktv10YApBiR0xe/hkTsNFWK18fyjXhUHRp/g8L5rIQQpgM7z24w9CR1pvOvlmkwJD1Ct5vKwYR4EO5Lb9dGAKQYkdMXv4ZE7DRVitfH7ol0VB0af4PC+ayEEKYDO89uMPQkdabzr5ZpMCQ9QrebysGEeBDuS2/XRgCkGJHTF7+GROw0VYrXx+6JdFQdGn+DwvmshBCmAzvPbjD0JHWm86+WaTAkPUK3m8rBhHgQ7ktv10YApBiR0xe/hkTsNFWK18fyjXhUHRp/g8L5rIQQpgM7z24w9CR1pvOvlmkwJD1Ct5vKwYR4EO5Lb9dGAKQYkdMXv4ZE7DRVitfH7ol0VB0af4PC+ayEEKYDO89uMPQkdabzr5ZpMCQ9QrebysGEeBDuS2/XRgCkGJHTF7+GROw0VYrXx+6JdFQdGn+Dwvmsh');
            audio.volume = 0.3;
            audio.play().catch(() => {
              // Silently fail if audio doesn't play
            });
          } catch (error) {
            // Ignore audio errors
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime leads status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🔕 Unsubscribing from realtime leads');
      // 🔥 Unsubscribe antes de remover canal
      channel.unsubscribe().then(() => {
        supabase.removeChannel(channel);
      });
    };
  }, [userId]);

  const clearNewLeads = () => {
    setNewLeads([]);
  };

  return {
    newLeads,
    isConnected,
    clearNewLeads,
  };
};

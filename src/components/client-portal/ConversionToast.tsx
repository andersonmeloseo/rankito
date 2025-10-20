import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { Phone, MessageCircle } from 'lucide-react';

interface Conversion {
  id: string;
  event_type: string;
  page_path: string;
  cta_text: string | null;
}

interface ConversionToastProps {
  conversion: Conversion | null;
  soundEnabled?: boolean;
}

export const ConversionToast = ({ conversion, soundEnabled = true }: ConversionToastProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!conversion) return;

    const eventType = conversion.event_type.toLowerCase();
    
    // Notificar apenas para conversões importantes
    if (eventType.includes('phone') || eventType.includes('whatsapp') || eventType.includes('telefone')) {
      const isWhatsApp = eventType.includes('whatsapp');
      const icon = isWhatsApp ? '💬' : '📞';
      
      toast({
        title: `${icon} Nova Conversão ${isWhatsApp ? 'WhatsApp' : 'Telefone'}!`,
        description: `Página: ${conversion.page_path}${conversion.cta_text ? ` | CTA: "${conversion.cta_text}"` : ''}`,
        duration: 5000,
      });

      // Tocar som se habilitado
      if (soundEnabled) {
        try {
          // Criar som de notificação simples
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
          console.log('Som de notificação não disponível');
        }
      }
    }
  }, [conversion, soundEnabled]);

  return null;
};
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Eye, Phone, MessageSquare, Mail } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LiveConversionBannerProps {
  conversion: {
    id: string;
    event_type: string;
    page_path: string;
    page_url: string;
    created_at: string;
    city?: string;
    region?: string;
  };
  onDismiss: () => void;
  onViewDetails: (conversionId: string) => void;
}

export const LiveConversionBanner = ({
  conversion,
  onDismiss,
  onViewDetails,
}: LiveConversionBannerProps) => {
  const [timeAgo, setTimeAgo] = useState('agora');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 100);

    // Atualizar tempo decorrido a cada segundo
    const interval = setInterval(() => {
      setTimeAgo(formatDistanceToNow(new Date(conversion.created_at), {
        addSuffix: true,
        locale: ptBR,
      }));
    }, 1000);

    // Auto-dismiss após 10 segundos
    const timeout = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [conversion.created_at]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const getEventIcon = () => {
    switch (conversion.event_type) {
      case 'phone_click':
        return <Phone className="w-5 h-5" />;
      case 'whatsapp_click':
        return <MessageSquare className="w-5 h-5" />;
      case 'email_click':
        return <Mail className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  const getEventText = () => {
    switch (conversion.event_type) {
      case 'phone_click':
        return 'ligou';
      case 'whatsapp_click':
        return 'clicou em WhatsApp';
      case 'email_click':
        return 'enviou email';
      default:
        return 'converteu';
    }
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <Card className="border-2 border-primary shadow-2xl bg-card/95 backdrop-blur-sm">
        <div className="p-4 flex items-start gap-4">
          {/* Indicador LIVE */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <Badge variant="destructive" className="font-bold">
              LIVE
            </Badge>
          </div>

          {/* Ícone do Tipo de Conversão */}
          <div className="p-3 rounded-lg bg-primary/10 text-primary mt-0.5">
            {getEventIcon()}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">
              Nova conversão {timeAgo}!
            </h3>
            <p className="text-muted-foreground">
              Visitante {getEventText()} na página{' '}
              <span className="font-medium text-foreground">{conversion.page_path}</span>
              {conversion.city && conversion.region && (
                <span className="text-sm">
                  {' · '}{conversion.city}, {conversion.region}
                </span>
              )}
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(conversion.id)}
            >
              Ver Detalhes
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

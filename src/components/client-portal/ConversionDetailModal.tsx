import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Monitor,
  Globe,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversionDetailModalProps {
  conversion: {
    id: string;
    event_type: string;
    page_path: string;
    page_url: string;
    created_at: string;
    city?: string;
    region?: string;
    country?: string;
    user_agent?: string;
    referrer?: string;
    ip_address?: string;
    metadata?: any;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ConversionDetailModal = ({
  conversion,
  isOpen,
  onClose,
}: ConversionDetailModalProps) => {
  if (!conversion) return null;

  const getEventIcon = () => {
    switch (conversion.event_type) {
      case 'phone_click':
        return <Phone className="w-5 h-5" />;
      case 'whatsapp_click':
        return <MessageSquare className="w-5 h-5" />;
      case 'email_click':
        return <Mail className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getEventLabel = () => {
    switch (conversion.event_type) {
      case 'phone_click':
        return 'Ligação Telefônica';
      case 'whatsapp_click':
        return 'Mensagem WhatsApp';
      case 'email_click':
        return 'Email';
      default:
        return 'Conversão';
    }
  };

  const getDeviceInfo = () => {
    if (!conversion.user_agent) return 'Desconhecido';
    
    const ua = conversion.user_agent.toLowerCase();
    if (ua.includes('mobile')) return 'Mobile';
    if (ua.includes('tablet')) return 'Tablet';
    return 'Desktop';
  };

  const getBrowserInfo = () => {
    if (!conversion.user_agent) return 'Desconhecido';
    
    const ua = conversion.user_agent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('edge')) return 'Edge';
    return 'Outro';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              {getEventIcon()}
            </div>
            <div>
              <DialogTitle className="text-2xl">{getEventLabel()}</DialogTitle>
              <DialogDescription>
                {format(new Date(conversion.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações da Página */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Página de Origem
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Caminho:</span>
                <p className="font-medium">{conversion.page_path}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">URL Completa:</span>
                <a
                  href={conversion.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  {conversion.page_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {conversion.referrer && (
                <div>
                  <span className="text-sm text-muted-foreground">Referência:</span>
                  <p className="text-sm">{conversion.referrer}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Localização */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização do Visitante
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {conversion.city || 'Cidade desconhecida'}
                </Badge>
                <Badge variant="outline">
                  {conversion.region || 'Estado desconhecido'}
                </Badge>
                {conversion.country && (
                  <Badge variant="outline">{conversion.country}</Badge>
                )}
              </div>
              {conversion.ip_address && (
                <p className="text-sm text-muted-foreground">
                  IP: {conversion.ip_address.substring(0, 10)}***
                </p>
              )}
            </div>
          </Card>

          {/* Dispositivo e Navegador */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Dispositivo e Navegador
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Dispositivo:</span>
                <p className="font-medium">{getDeviceInfo()}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Navegador:</span>
                <p className="font-medium">{getBrowserInfo()}</p>
              </div>
            </div>
            {conversion.user_agent && (
              <div className="mt-3">
                <span className="text-sm text-muted-foreground">User Agent:</span>
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  {conversion.user_agent}
                </p>
              </div>
            )}
          </Card>

          {/* Metadados Adicionais */}
          {conversion.metadata && Object.keys(conversion.metadata).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Informações Adicionais
              </h3>
              <div className="space-y-2">
                {Object.entries(conversion.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <p className="text-sm">{String(value)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

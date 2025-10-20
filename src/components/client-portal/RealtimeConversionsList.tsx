import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, MessageCircle, Mail, MousePointerClick, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversion {
  id: string;
  event_type: string;
  page_path: string;
  cta_text: string | null;
  created_at: string;
  metadata: any;
}

interface RealtimeConversionsListProps {
  conversions: Conversion[];
}

const getEventIcon = (eventType: string) => {
  switch (eventType.toLowerCase()) {
    case 'phone_click':
    case 'telefone':
      return <Phone className="h-4 w-4" />;
    case 'whatsapp':
    case 'whatsapp_click':
      return <MessageCircle className="h-4 w-4" />;
    case 'email':
    case 'email_click':
      return <Mail className="h-4 w-4" />;
    default:
      return <MousePointerClick className="h-4 w-4" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType.toLowerCase()) {
    case 'phone_click':
    case 'telefone':
      return 'text-blue-600';
    case 'whatsapp':
    case 'whatsapp_click':
      return 'text-green-600';
    case 'email':
    case 'email_click':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
};

export const RealtimeConversionsList = ({ conversions }: RealtimeConversionsListProps) => {
  if (conversions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Últimas Conversões (Tempo Real)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aguardando novas conversões...</p>
            <p className="text-sm mt-1">Conversões aparecerão aqui em tempo real</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Últimas Conversões (Tempo Real)
          <Badge variant="outline" className="ml-auto">
            {conversions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {conversions.map((conversion, index) => {
              const isNew = index < 3;
              const timeAgo = formatDistanceToNow(new Date(conversion.created_at), {
                addSuffix: true,
                locale: ptBR,
              });

              return (
                <div
                  key={conversion.id}
                  className={`
                    p-4 rounded-lg border transition-all
                    ${isNew ? 'bg-green-50 border-green-200 animate-fade-in' : 'bg-card'}
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg bg-background ${getEventColor(conversion.event_type)}`}>
                        {getEventIcon(conversion.event_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">
                            {conversion.event_type.replace('_', ' ')}
                          </span>
                          {isNew && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              NOVA
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate">
                          Página: {conversion.page_path}
                        </p>
                        
                        {conversion.cta_text && (
                          <p className="text-xs text-muted-foreground mt-1">
                            CTA: "{conversion.cta_text}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                      {timeAgo}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
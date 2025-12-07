import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCampaignEvents, CampaignConfig } from "@/hooks/useCampaignConfigs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MousePointer2, 
  Eye, 
  Phone, 
  Mail, 
  MessageCircle,
  FileText,
  MapPin,
  Clock,
  Target,
  DollarSign,
  ExternalLink
} from "lucide-react";

interface CampaignEventsDrawerProps {
  siteId: string;
  campaign: CampaignConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'page_view':
      return <Eye className="h-4 w-4 text-primary" />;
    case 'whatsapp_click':
      return <MessageCircle className="h-4 w-4 text-success" />;
    case 'phone_click':
      return <Phone className="h-4 w-4 text-success" />;
    case 'email_click':
      return <Mail className="h-4 w-4 text-success" />;
    case 'form_submit':
      return <FileText className="h-4 w-4 text-success" />;
    default:
      return <MousePointer2 className="h-4 w-4 text-warning" />;
  }
};

const getEventLabel = (eventType: string) => {
  const labels: Record<string, string> = {
    page_view: 'Visualização',
    whatsapp_click: 'WhatsApp',
    phone_click: 'Telefone',
    email_click: 'E-mail',
    form_submit: 'Formulário',
    button_click: 'Clique',
  };
  return labels[eventType] || eventType;
};

export const CampaignEventsDrawer = ({ 
  siteId, 
  campaign, 
  open, 
  onOpenChange 
}: CampaignEventsDrawerProps) => {
  const { data: events = [], isLoading } = useCampaignEvents(siteId, campaign);

  // Se tem meta vinculada, todos os eventos são conversões da meta
  const isFilteredByGoal = !!campaign?.goal_id;

  // Calculate metrics
  const conversions = isFilteredByGoal ? events.length : events.filter(e => e.event_type !== 'page_view').length;
  const totalValue = events.reduce((sum, e) => sum + (e.conversion_value || 0), 0);
  
  // Métricas de ROI
  const budget = campaign?.budget || 0;
  const cpa = conversions > 0 ? budget / conversions : 0;
  const roi = budget > 0 ? ((totalValue - budget) / budget) * 100 : 0;
  const hasRoiData = budget > 0;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {campaign?.campaign_name || 'Eventos da Campanha'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Campaign Info */}
          {campaign && (
            <div className="flex flex-wrap gap-2">
              {campaign.utm_campaign_pattern && (
                <Badge variant="outline">
                  utm_campaign: {campaign.utm_campaign_pattern}
                </Badge>
              )}
              {campaign.utm_source_pattern && (
                <Badge variant="outline">
                  source: {campaign.utm_source_pattern}
                </Badge>
              )}
              {campaign.goal && (
                <Badge variant="default" className="bg-success">
                  🎯 Filtrando por: {campaign.goal.goal_name}
                </Badge>
              )}
            </div>
          )}

          {/* Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-success">{conversions}</p>
              <p className="text-xs text-muted-foreground">Conversões</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </div>
            {hasRoiData && (
              <>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    R$ {cpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">CPA</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${roi >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <p className={`text-2xl font-bold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">ROI</p>
                </div>
              </>
            )}
          </div>

          {/* Budget info */}
          {hasRoiData && (
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Orçamento investido</span>
              <span className="font-medium">R$ {budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <Separator />

          {/* Events List */}
          <div>
            <h4 className="text-sm font-medium mb-2">Eventos ({events.length})</h4>
            <ScrollArea className="h-[calc(100vh-380px)]">
              {isLoading ? (
                <p className="text-sm text-muted-foreground p-4 text-center">Carregando...</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Nenhum evento encontrado nos últimos 30 dias
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-muted/30 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type)}
                          <Badge 
                            variant={event.event_type === 'page_view' ? 'outline' : 'default'}
                            className={event.event_type !== 'page_view' ? 'bg-success' : ''}
                          >
                            {getEventLabel(event.event_type)}
                          </Badge>
                          {event.goal_name && (
                            <Badge variant="secondary" className="text-xs">
                              {event.goal_name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      {event.cta_text && (
                        <p className="text-sm font-medium text-foreground pl-6">
                          "{event.cta_text}"
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pl-6">
                        <a 
                          href={event.page_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {event.page_path}
                        </a>
                        {event.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.city}, {event.region}
                          </span>
                        )}
                      </div>

                      {/* UTM Info */}
                      <div className="flex flex-wrap gap-1 pl-6">
                        {event.utm_source && (
                          <Badge variant="outline" className="text-xs">
                            {event.utm_source}
                          </Badge>
                        )}
                        {event.utm_medium && (
                          <Badge variant="outline" className="text-xs">
                            {event.utm_medium}
                          </Badge>
                        )}
                        {event.gclid && (
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            Google Ads
                          </Badge>
                        )}
                        {event.fbclid && (
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            Meta Ads
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

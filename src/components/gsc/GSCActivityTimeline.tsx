import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Trash2, 
  Send, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  ExternalLink 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Activity } from '@/hooks/useGSCActivity';

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'integration_connected': 
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'integration_disconnected': 
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'sitemap_submitted': 
      return <FileText className="h-4 w-4 text-blue-600" />;
    case 'sitemap_deleted': 
      return <Trash2 className="h-4 w-4 text-gray-600" />;
    case 'url_indexed': 
      return <Send className="h-4 w-4 text-purple-600" />;
    case 'indexing_error': 
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'sitemap_error': 
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    default: 
      return <Info className="h-4 w-4 text-gray-600" />;
  }
};

interface GSCActivityTimelineProps {
  activities: Activity[];
}

export const GSCActivityTimeline = ({ activities }: GSCActivityTimelineProps) => {
  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Timeline de Atividades</CardTitle>
          <CardDescription>
            Histórico de todas as ações realizadas nas integrações GSC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhuma atividade registrada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Timeline de Atividades</CardTitle>
        <CardDescription>
          Histórico de todas as ações realizadas nas integrações GSC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3 relative">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1 z-10 bg-card">
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.integration_name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                  
                  {activity.description && (
                    <p className="text-sm text-muted-foreground break-all">
                      {activity.description}
                    </p>
                  )}
                  
                  {activity.metadata?.url && (
                    <a 
                      href={activity.metadata.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      {activity.metadata.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  
                  {activity.metadata?.error_message && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription className="text-xs">
                        {activity.metadata.error_message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* Separator line (except last item) */}
                {index < activities.length - 1 && (
                  <div className="absolute left-[8px] top-[24px] w-px h-full bg-border" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

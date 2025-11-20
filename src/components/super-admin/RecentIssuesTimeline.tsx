import { Clock, AlertTriangle, AlertCircle, Zap, Globe, Bug, Smile } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentIssuesTimelineProps {
  metrics: {
    recentIssues: Array<{
      type: 'gsc_alert' | 'edge_function' | 'geo_api' | 'system_error';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: string;
    }>;
  };
}

export const RecentIssuesTimeline = ({ metrics }: RecentIssuesTimelineProps) => {
  const { recentIssues } = metrics;

  const getIssueIcon = (type: string, severity: string) => {
    const sizeClass = "h-5 w-5";
    const colorClass = severity === 'critical' ? 'text-red-500' : severity === 'high' ? 'text-orange-500' : severity === 'medium' ? 'text-yellow-500' : 'text-blue-500';
    
    switch (type) {
      case 'gsc_alert':
        return <AlertTriangle className={`${sizeClass} ${colorClass}`} />;
      case 'edge_function':
        return <Zap className={`${sizeClass} ${colorClass}`} />;
      case 'geo_api':
        return <Globe className={`${sizeClass} ${colorClass}`} />;
      case 'system_error':
        return <Bug className={`${sizeClass} ${colorClass}`} />;
      default:
        return <AlertCircle className={`${sizeClass} ${colorClass}`} />;
    }
  };

  const getSeverityVariant = (severity: string): "default" | "destructive" | "warning" => {
    if (severity === 'critical' || severity === 'high') return 'destructive';
    if (severity === 'medium') return 'warning';
    return 'default';
  };

  const getIssueTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      gsc_alert: 'Alerta GSC',
      edge_function: 'Edge Function',
      geo_api: 'API Geolocalização',
      system_error: 'Erro do Sistema',
    };
    return labels[type] || type;
  };

  if (recentIssues.length === 0) {
    return (
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Problemas Recentes (Últimas 24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Smile className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Nenhum Problema!</h3>
            <p className="text-sm text-muted-foreground">
              Nenhum problema detectado nas últimas 24 horas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Problemas Recentes (Últimas 24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {recentIssues.map((issue, idx) => (
            <div key={idx} className="flex items-start gap-4 border-l-2 border-border pl-4 pb-4">
              <div className="flex-shrink-0 mt-1">
                {getIssueIcon(issue.type, issue.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getSeverityVariant(issue.severity)} className="text-xs">
                    {issue.severity === 'critical' ? 'Crítico' : 
                     issue.severity === 'high' ? 'Alto' :
                     issue.severity === 'medium' ? 'Médio' : 'Baixo'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(issue.timestamp), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm font-medium mt-1">{getIssueTypeLabel(issue.type)}</p>
                <p className="text-xs text-muted-foreground mt-1 break-words">{issue.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

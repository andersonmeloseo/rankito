import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IntegrationBreakdown {
  integration_id: string;
  name: string;
  email: string;
  used: number;
  limit: number;
  remaining: number;
  health_status?: 'healthy' | 'unhealthy' | 'checking';
  last_error?: string;
  health_check_at?: string;
}

interface GSCIntegrationHealthCardProps {
  integrations: IntegrationBreakdown[];
  onHealthCheck?: () => void;
}

export const GSCIntegrationHealthCard = ({ 
  integrations, 
  onHealthCheck 
}: GSCIntegrationHealthCardProps) => {
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const unhealthyIntegrations = integrations.filter(i => i.health_status === 'unhealthy');
  const hasUnhealthyIntegrations = unhealthyIntegrations.length > 0;

  const handleCheckHealth = async (integrationId: string, integrationName: string) => {
    setCheckingId(integrationId);
    
    const toastId = toast.loading(`Verificando saúde de ${integrationName}...`);

    try {
      const { data, error } = await supabase.functions.invoke('gsc-check-integration-health', {
        body: { integration_id: integrationId },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`✅ ${integrationName} está operacional novamente!`, { id: toastId });
        onHealthCheck?.();
      } else {
        toast.warning(data.message, { id: toastId });
      }
    } catch (error: any) {
      console.error('Erro ao verificar saúde:', error);
      toast.error('Erro ao verificar saúde da integração', { id: toastId });
    } finally {
      setCheckingId(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Operacional</Badge>;
      case 'unhealthy':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Indisponível</Badge>;
      case 'checking':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Verificando</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatCooldownEnd = (healthCheckAt?: string) => {
    if (!healthCheckAt) return null;
    
    const cooldownEnd = new Date(healthCheckAt);
    const now = new Date();
    const diffMs = cooldownEnd.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Pronto para verificar';
    }
    
    const diffMins = Math.ceil(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    if (diffHours > 0) {
      return `Disponível em ${diffHours}h ${remainingMins}m`;
    }
    return `Disponível em ${diffMins}m`;
  };

  if (!hasUnhealthyIntegrations && integrations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Alerta Principal */}
      {hasUnhealthyIntegrations && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">
                  {unhealthyIntegrations.length} integração(ões) temporariamente indisponível(is)
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  As integrações abaixo atingiram o limite diário ou apresentaram erros. 
                  Elas serão reativadas automaticamente às 00:00 UTC ou você pode verificar manualmente.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Status Detalhado por Integração */}
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-4">Status das Integrações GSC</h3>
          <div className="space-y-3">
            {integrations.map((integration) => {
              const isUnhealthy = integration.health_status === 'unhealthy';
              const cooldownText = formatCooldownEnd(integration.health_check_at);
              const canCheck = !integration.health_check_at || new Date(integration.health_check_at) <= new Date();

              return (
                <div 
                  key={integration.integration_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isUnhealthy ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(integration.health_status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{integration.name}</span>
                        {getStatusBadge(integration.health_status)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {integration.email}
                      </div>
                      {isUnhealthy && integration.last_error && (
                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {integration.last_error}
                        </div>
                      )}
                      {isUnhealthy && cooldownText && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cooldownText}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {integration.remaining}/{integration.limit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        URLs disponíveis
                      </div>
                    </div>

                    {isUnhealthy && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckHealth(integration.integration_id, integration.name)}
                        disabled={!canCheck || checkingId === integration.integration_id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${checkingId === integration.integration_id ? 'animate-spin' : ''}`} />
                        {canCheck ? 'Verificar' : 'Aguardar'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

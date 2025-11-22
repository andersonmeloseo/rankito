import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock, Ban } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RetryStatusBadgeProps {
  retryCount?: number;
  nextRetryAt?: string;
  retryReason?: string;
}

export const RetryStatusBadge = ({ retryCount, nextRetryAt, retryReason }: RetryStatusBadgeProps) => {
  // Não exibir se não houver retry pendente
  if (!retryCount || retryCount === 0 || !nextRetryAt) {
    return null;
  }

  // Se atingiu limite de 3 retries
  if (retryCount >= 3) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="destructive" className="gap-1">
              <Ban className="h-3 w-3" />
              Retry Esgotado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Máximo de 3 tentativas atingido</p>
            <p className="text-xs text-muted-foreground mt-1">
              Motivo: {getRetryReasonLabel(retryReason)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const nextRetryDate = new Date(nextRetryAt);
  const isPast = nextRetryDate < new Date();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
            <RefreshCw className="h-3 w-3" />
            Retry {retryCount}/3
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">
            {isPast ? 'Retry agendado (processando)' : 'Próximo retry agendado'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isPast 
              ? 'Aguardando processamento' 
              : `Em ${formatDistanceToNow(nextRetryDate, { locale: ptBR, addSuffix: false })}`
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Motivo: {getRetryReasonLabel(retryReason)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

function getRetryReasonLabel(reason?: string): string {
  switch (reason) {
    case 'quota_exceeded':
      return 'Quota diária esgotada';
    case 'rate_limit':
      return 'Rate limit do Google';
    case 'auth_error':
      return 'Erro de autenticação';
    case 'temporary_error':
      return 'Erro temporário';
    case 'network_error':
      return 'Erro de rede';
    default:
      return 'Não especificado';
  }
}

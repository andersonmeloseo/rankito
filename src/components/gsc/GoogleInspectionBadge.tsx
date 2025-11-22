import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Search, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GoogleInspectionBadgeProps {
  inspectionStatus?: string;
  lastInspectedAt?: string;
}

export const GoogleInspectionBadge = ({ inspectionStatus, lastInspectedAt }: GoogleInspectionBadgeProps) => {
  if (!inspectionStatus) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="gap-1">
              <HelpCircle className="h-3 w-3" />
              Não Consultado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Status ainda não foi consultado no Google</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  let icon = <HelpCircle className="h-3 w-3" />;
  let label = 'Desconhecido';
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let className = "";
  let description = "";

  switch (inspectionStatus) {
    case 'INDEXED':
      icon = <CheckCircle className="h-3 w-3" />;
      label = '✅ Indexado';
      className = "bg-green-100 text-green-800 border-green-200";
      description = "URL está indexada no Google";
      break;
    
    case 'DISCOVERED_NOT_INDEXED':
      icon = <Search className="h-3 w-3" />;
      label = 'Descoberto';
      className = "bg-blue-100 text-blue-800 border-blue-200";
      description = "Google descobriu mas ainda não indexou";
      break;
    
    case 'CRAWLED_NOT_INDEXED':
      icon = <Clock className="h-3 w-3" />;
      label = 'Crawleado';
      className = "bg-yellow-100 text-yellow-800 border-yellow-200";
      description = "Google crawleou mas ainda não indexou";
      break;
    
    case 'DISCOVERY_PENDING':
      icon = <Clock className="h-3 w-3" />;
      label = 'Pendente';
      className = "bg-gray-100 text-gray-800 border-gray-200";
      description = "Aguardando descoberta pelo Google";
      break;
    
    case 'URL_IS_UNKNOWN':
      icon = <AlertCircle className="h-3 w-3" />;
      label = 'Desconhecido';
      variant = "secondary";
      description = "Google não conhece esta URL";
      break;
    
    case 'ERROR':
      icon = <XCircle className="h-3 w-3" />;
      label = 'Erro';
      variant = "destructive";
      description = "Erro ao consultar status no Google";
      break;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={variant} className={`gap-1 ${className}`}>
            {icon}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{description}</p>
          {lastInspectedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Última consulta: {new Date(lastInspectedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

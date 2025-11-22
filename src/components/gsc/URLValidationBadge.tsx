import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock, Copy } from "lucide-react";

interface URLValidationBadgeProps {
  validationStatus?: string;
  validationError?: string;
}

export const URLValidationBadge = ({ validationStatus, validationError }: URLValidationBadgeProps) => {
  if (!validationStatus || validationStatus === 'pending') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Pendente
      </Badge>
    );
  }

  switch (validationStatus) {
    case 'valid':
      return (
        <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Válida
        </Badge>
      );
    
    case 'invalid_domain':
      return (
        <Badge variant="destructive" className="gap-1" title={validationError}>
          <XCircle className="h-3 w-3" />
          Domínio Inválido
        </Badge>
      );
    
    case 'unreachable':
      return (
        <Badge variant="destructive" className="gap-1 bg-orange-100 text-orange-800 border-orange-200" title={validationError}>
          <AlertTriangle className="h-3 w-3" />
          Inacessível
        </Badge>
      );
    
    case 'duplicate':
      return (
        <Badge variant="secondary" className="gap-1" title={validationError}>
          <Copy className="h-3 w-3" />
          Duplicada
        </Badge>
      );
    
    default:
      return null;
  }
};

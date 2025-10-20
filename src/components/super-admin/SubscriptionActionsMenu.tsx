import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Clock, 
  Pause, 
  Play, 
  Ban, 
  CheckCircle, 
  History 
} from "lucide-react";
import { UserSubscription } from "@/hooks/useSubscriptions";

interface SubscriptionActionsMenuProps {
  subscription: UserSubscription;
  onEdit: () => void;
  onViewDetails: () => void;
  onExtend: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onReactivate: () => void;
  onViewHistory: () => void;
}

export const SubscriptionActionsMenu = ({
  subscription,
  onEdit,
  onViewDetails,
  onExtend,
  onPause,
  onResume,
  onCancel,
  onReactivate,
  onViewHistory,
}: SubscriptionActionsMenuProps) => {
  const isPaused = subscription.status === 'past_due' && subscription.paused_at;
  const isActive = subscription.status === 'active' || subscription.status === 'trial';
  const isCanceled = subscription.status === 'canceled';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Assinatura
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onViewDetails}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onExtend}>
          <Clock className="mr-2 h-4 w-4" />
          Estender Período
        </DropdownMenuItem>
        
        {isActive && !isPaused && (
          <DropdownMenuItem onClick={onPause}>
            <Pause className="mr-2 h-4 w-4" />
            Pausar
          </DropdownMenuItem>
        )}
        
        {isPaused && (
          <DropdownMenuItem onClick={onResume}>
            <Play className="mr-2 h-4 w-4" />
            Retomar
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onViewHistory}>
          <History className="mr-2 h-4 w-4" />
          Ver Histórico
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {(isActive || isPaused) && (
          <DropdownMenuItem 
            onClick={onCancel}
            className="text-destructive focus:text-destructive"
          >
            <Ban className="mr-2 h-4 w-4" />
            Cancelar
          </DropdownMenuItem>
        )}
        
        {isCanceled && (
          <DropdownMenuItem onClick={onReactivate}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Reativar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

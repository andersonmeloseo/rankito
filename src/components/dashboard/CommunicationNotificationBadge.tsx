import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CommunicationNotificationBadgeProps {
  count: number;
  onClick: () => void;
}

export function CommunicationNotificationBadge({ count, onClick }: CommunicationNotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="relative flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full hover:bg-destructive/90 transition-all hover:scale-105 active:scale-95 animate-pulse shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            <Badge 
              variant="secondary" 
              className="bg-white text-destructive font-bold px-2 py-0.5"
            >
              {count}
            </Badge>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Você tem {count} mensagem{count > 1 ? 's' : ''} não lida{count > 1 ? 's' : ''}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { Button } from "@/components/ui/button";
import { MessageSquarePlus, CalendarPlus, Phone, Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickActionsProps {
  onAddNote: () => void;
  onAddTask: () => void;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isDragging?: boolean;
}

export const QuickActions = ({ onAddNote, onAddTask, contactPhone, contactEmail, isDragging }: QuickActionsProps) => {
  return (
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-primary hover:text-primary-foreground"
              disabled={isDragging}
              onClick={(e) => {
                e.stopPropagation();
                onAddNote();
              }}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Adicionar nota rápida</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-primary hover:text-primary-foreground"
              disabled={isDragging}
              onClick={(e) => {
                e.stopPropagation();
                onAddTask();
              }}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Agendar tarefa</TooltipContent>
        </Tooltip>

        {contactPhone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-7 w-7 hover:bg-green-500 hover:text-white"
                disabled={isDragging}
                onClick={(e) => e.stopPropagation()}
              >
                <a href={`tel:${contactPhone}`}>
                  <Phone className="h-3.5 w-3.5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ligar</TooltipContent>
          </Tooltip>
        )}

        {contactEmail && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-7 w-7 hover:bg-blue-500 hover:text-white"
                disabled={isDragging}
                onClick={(e) => e.stopPropagation()}
              >
                <a href={`mailto:${contactEmail}`}>
                  <Mail className="h-3.5 w-3.5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Enviar email</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

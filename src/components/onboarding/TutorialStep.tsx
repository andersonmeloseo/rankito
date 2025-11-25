import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { TutorialStep as TutorialStepType } from "./tutorialSteps";

interface TutorialStepProps {
  step: TutorialStepType;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onAction?: () => void;
}

export const TutorialStep = ({
  step,
  isCompleted,
  onToggleComplete,
  onAction,
}: TutorialStepProps) => {
  const Icon = step.icon;

  return (
    <div 
      className={`
        p-4 rounded-lg border transition-all
        ${isCompleted 
          ? 'bg-primary/5 border-primary/20' 
          : 'bg-card border-border hover:border-primary/30'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="flex items-center pt-0.5">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onToggleComplete}
            className="h-5 w-5"
          />
        </div>

        {/* Icon */}
        <div 
          className={`
            flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
            ${isCompleted 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
            }
          `}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium leading-tight ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {step.title}
              </h3>
              {step.isOptional && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Opcional
                </Badge>
              )}
            </div>
            
            {isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Action Button */}
          {step.action && onAction && !isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAction}
              className="gap-2 mt-2"
            >
              {step.actionLabel || "Ir para →"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

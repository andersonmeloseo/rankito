import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TutorialCategory as TutorialCategoryType } from "./tutorialSteps";
import { TutorialStep } from "./TutorialStep";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialCategoryProps {
  category: TutorialCategoryType;
  completedSteps: Set<string>;
  onToggleStep: (stepId: string) => void;
  onStepAction?: (action: string) => void;
  defaultOpen?: boolean;
}

export const TutorialCategory = ({
  category,
  completedSteps,
  onToggleStep,
  onStepAction,
  defaultOpen = false,
}: TutorialCategoryProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = category.icon;

  const completedCount = category.steps.filter((s) =>
    completedSteps.has(s.id)
  ).length;
  const totalCount = category.steps.length;
  const allCompleted = completedCount === totalCount;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}

          <div
            className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${allCompleted 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
            }
          `}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="text-left">
            <h2 className="font-semibold text-base">{category.title}</h2>
            <p className="text-xs text-muted-foreground">
              {completedCount} de {totalCount} passos concluídos
            </p>
          </div>
        </div>

        <Badge
          variant={allCompleted ? "default" : "outline"}
          className={allCompleted ? "bg-primary/10 text-primary border-primary/20" : ""}
        >
          {completedCount}/{totalCount}
        </Badge>
      </button>

      {/* Steps */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-3">
              {category.steps.map((step) => (
                <TutorialStep
                  key={step.id}
                  step={step}
                  isCompleted={completedSteps.has(step.id)}
                  onToggleComplete={() => onToggleStep(step.id)}
                  onAction={
                    step.action && onStepAction
                      ? () => onStepAction(step.action!)
                      : undefined
                  }
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

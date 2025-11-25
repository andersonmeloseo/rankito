import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { tutorialCategories } from "./tutorialSteps";
import { TutorialCategory } from "./TutorialCategory";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface CompleteTutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CompleteTutorialModal = ({
  open,
  onOpenChange,
}: CompleteTutorialModalProps) => {
  const navigate = useNavigate();
  const {
    completedSteps,
    markStepComplete,
    markStepIncomplete,
    isStepComplete,
    markAllComplete,
    resetProgress,
    progress,
  } = useTutorialProgress();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["setup"])
  );

  const handleToggleStep = (stepId: string) => {
    if (isStepComplete(stepId)) {
      markStepIncomplete(stepId);
    } else {
      markStepComplete(stepId);
    }
  };

  const handleStepAction = (action: string) => {
    // Close modal and perform action
    onOpenChange(false);
    
    switch (action) {
      case "add-site":
        // Will be handled by Dashboard component
        break;
      case "view-projects":
        navigate("/dashboard?tab=sites");
        break;
      case "setup-gsc":
        navigate("/dashboard?tab=sites");
        break;
      case "view-analytics":
        navigate("/dashboard?tab=sites");
        break;
      case "view-reports":
        navigate("/dashboard?tab=sites");
        break;
    }
  };

  const handleExpandAll = () => {
    setExpandedCategories(new Set(tutorialCategories.map((c) => c.id)));
  };

  const handleCollapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <DialogTitle className="text-2xl">
                📚 Tutorial Completo do Rankito CRM
              </DialogTitle>
              <DialogDescription className="text-base">
                Siga todos os passos para dominar completamente o sistema e
                otimizar seus projetos
              </DialogDescription>
            </div>

            {/* Progress Badge */}
            <Badge
              variant={progress.completed === progress.total ? "default" : "outline"}
              className="flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              {progress.completed === progress.total && (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {progress.completed} / {progress.total}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </DialogHeader>

        {/* Categories List */}
        <ScrollArea className="flex-1 px-6 py-4 max-h-[60vh]">
          <div className="space-y-4 pb-4">
            {/* Expand/Collapse Controls */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandAll}
                className="gap-2 text-xs"
              >
                <ChevronDown className="w-4 h-4" />
                Expandir Tudo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseAll}
                className="gap-2 text-xs"
              >
                <ChevronUp className="w-4 h-4" />
                Recolher Tudo
              </Button>
            </div>

            {tutorialCategories.map((category) => (
              <TutorialCategory
                key={category.id}
                category={category}
                completedSteps={completedSteps}
                onToggleStep={handleToggleStep}
                onStepAction={handleStepAction}
                defaultOpen={expandedCategories.has(category.id)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-4 bg-muted/30">
          <Button
            variant="ghost"
            onClick={resetProgress}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Resetar Progresso
          </Button>

          <div className="flex gap-2">
            {progress.completed < progress.total && (
              <Button
                variant="outline"
                onClick={markAllComplete}
              >
                Marcar Tudo como Visto
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)}>
              {progress.completed === progress.total
                ? "Concluído!"
                : "Fechar Tutorial"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

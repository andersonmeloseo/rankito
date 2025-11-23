import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Rocket,
  Globe,
  Search,
  BarChart3,
  Zap
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

interface OnboardingTourProps {
  onAction?: (action: string) => void;
}

const stepIcons = {
  welcome: Rocket,
  "create-project": Globe,
  "setup-gsc": Search,
  "install-tracking": Zap,
  "explore-analytics": BarChart3,
};

export const OnboardingTour = ({ onAction }: OnboardingTourProps) => {
  const {
    steps,
    currentStep,
    isOpen,
    setIsOpen,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const current = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const StepIcon = stepIcons[current?.id as keyof typeof stepIcons] || Circle;

  const handleAction = () => {
    if (current?.action) {
      onAction?.(current.action);
      
      // Auto-advance to next step after action
      if (currentStep < steps.length - 1) {
        setTimeout(() => {
          nextStep();
        }, 500);
      }
    }
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="gap-1.5">
              Passo {currentStep + 1} de {steps.length}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipOnboarding}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Progress value={progress} className="h-2 mb-4" />
          
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full",
              "bg-gradient-to-br from-primary/20 to-primary/5",
              "border-2 border-primary/20"
            )}>
              <StepIcon className="w-6 h-6 text-primary" />
            </div>
            {current?.title}
          </DialogTitle>
          
          <DialogDescription className="text-base pt-2">
            {current?.description}
          </DialogDescription>
        </DialogHeader>

        {/* Steps Preview */}
        <div className="py-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Progresso do Tutorial:
          </p>
          
          <div className="grid gap-2">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  index === currentStep 
                    ? "bg-primary/5 border-primary/20 shadow-sm" 
                    : "bg-muted/30 border-border/50",
                  index < currentStep && "opacity-60"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : index === currentStep ? (
                  <Circle className="w-5 h-5 text-primary flex-shrink-0 fill-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    index === currentStep && "text-primary"
                  )}>
                    {step.title.replace(/[🎉🚀]/g, '').trim()}
                  </p>
                </div>
                
                {step.completed && (
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                    Concluído
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
            
            {current?.action && (
              <Button
                variant="secondary"
                onClick={handleAction}
                className="gap-2 flex-1"
              >
                {current.actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleNext}
            className="gap-2 min-w-[140px]"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Finalizar
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

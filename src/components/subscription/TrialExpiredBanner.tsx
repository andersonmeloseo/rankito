import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTrialStatus } from "@/hooks/useTrialStatus";

export const TrialExpiredBanner = () => {
  const navigate = useNavigate();
  const { data: trialStatus } = useTrialStatus();

  if (!trialStatus?.isExpired) return null;

  return (
    <div className="border-b border-destructive/20 bg-destructive/5">
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-3">
        <Alert variant="destructive" className="border-destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Trial Expirado</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Seu período de trial expirou. Assine um plano para continuar usando a plataforma.
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/settings/subscription')}
              className="ml-4 bg-white hover:bg-gray-50 text-destructive border-destructive transition-all active:scale-[0.98]"
            >
              Ver Planos
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

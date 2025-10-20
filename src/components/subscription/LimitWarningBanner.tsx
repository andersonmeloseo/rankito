import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

export const LimitWarningBanner = () => {
  const { data: limits, isLoading } = useSubscriptionLimits();

  if (isLoading || !limits || limits.isUnlimited || limits.remainingSites === null || limits.remainingSites > 2) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">Você está próximo do limite!</AlertTitle>
      <AlertDescription className="text-orange-800">
        Restam apenas {limits.remainingSites} site(s) disponível(is) no seu plano {limits.plan?.name}.
        Entre em contato para fazer upgrade e continuar crescendo.
      </AlertDescription>
    </Alert>
  );
};

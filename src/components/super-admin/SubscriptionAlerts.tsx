import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { differenceInDays } from "date-fns";

interface SubscriptionAlertsProps {
  onFilterExpiring: () => void;
  onFilterExpired: () => void;
}

export const SubscriptionAlerts = ({ 
  onFilterExpiring, 
  onFilterExpired 
}: SubscriptionAlertsProps) => {
  const { subscriptions } = useSubscriptions();

  const expiringSoon = subscriptions?.filter(sub => {
    const days = differenceInDays(new Date(sub.current_period_end), new Date());
    return days >= 0 && days <= 7 && (sub.status === 'active' || sub.status === 'trial');
  });

  const expired = subscriptions?.filter(sub => sub.status === 'expired');

  if (!expiringSoon?.length && !expired?.length) return null;

  return (
    <div className="space-y-2 mb-4">
      {expiringSoon && expiringSoon.length > 0 && (
        <Alert variant="default" className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Atenção!</AlertTitle>
          <AlertDescription className="text-orange-800">
            {expiringSoon.length} assinatura(s) expirando nos próximos 7 dias.
            <Button 
              variant="link" 
              className="ml-2 h-auto p-0 text-orange-900" 
              onClick={onFilterExpiring}
            >
              Ver lista
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {expired && expired.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Urgente!</AlertTitle>
          <AlertDescription>
            {expired.length} assinatura(s) já expirada(s).
            <Button 
              variant="link" 
              className="ml-2 h-auto p-0 text-destructive-foreground underline" 
              onClick={onFilterExpired}
            >
              Ver lista
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";
import { usePaymentAlerts } from "@/hooks/usePaymentAlerts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentAlertsProps {
  userId: string;
}

export const PaymentAlerts = ({ userId }: PaymentAlertsProps) => {
  const { alerts, hasAlerts } = usePaymentAlerts(userId);

  if (!hasAlerts) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-3 mb-6">
      {alerts.overdue.count > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{alerts.overdue.count} pagamento{alerts.overdue.count > 1 ? 's' : ''} em atraso</strong>
            {' '}({formatCurrency(alerts.overdue.totalAmount)})
            {alerts.overdue.payments.length > 0 && (
              <div className="mt-2 space-y-1 text-sm">
                {alerts.overdue.payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex justify-between">
                    <span>{payment.site_name}</span>
                    <span>
                      {formatCurrency(payment.amount)} - 
                      {' '}{Math.abs(payment.days_diff)} dia{Math.abs(payment.days_diff) > 1 ? 's' : ''} atrasado
                    </span>
                  </div>
                ))}
                {alerts.overdue.payments.length > 3 && (
                  <div className="text-xs opacity-75">
                    + {alerts.overdue.payments.length - 3} outros pagamentos atrasados
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {alerts.dueSoon.count > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900 dark:text-yellow-200">
            <strong>{alerts.dueSoon.count} pagamento{alerts.dueSoon.count > 1 ? 's' : ''} vencendo nos próximos 7 dias</strong>
            {' '}({formatCurrency(alerts.dueSoon.totalAmount)})
            {alerts.dueSoon.payments.length > 0 && (
              <div className="mt-2 space-y-1 text-sm">
                {alerts.dueSoon.payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex justify-between">
                    <span>{payment.site_name}</span>
                    <span>
                      {formatCurrency(payment.amount)} - 
                      {' '}vence em {payment.days_diff} dia{payment.days_diff > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
                {alerts.dueSoon.payments.length > 3 && (
                  <div className="text-xs opacity-75">
                    + {alerts.dueSoon.payments.length - 3} outros pagamentos próximos
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

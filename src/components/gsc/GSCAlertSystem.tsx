import { useGSCAlerts } from "@/hooks/useGSCAlerts";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface GSCAlertSystemProps {
  siteId: string;
}

export function GSCAlertSystem({ siteId }: GSCAlertSystemProps) {
  const { queueSize, failureRate } = useGSCAlerts(siteId);

  const alerts = [];

  if (queueSize > 500) {
    alerts.push({
      type: 'warning' as const,
      message: `${queueSize} URLs pending in queue`,
      description: 'Large queue detected',
    });
  }

  if (failureRate >= 30) {
    alerts.push({
      type: 'error' as const,
      message: `${failureRate.toFixed(0)}% failure rate`,
      description: 'High failure rate in last 2 hours',
    });
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">All systems operational</p>
              <p className="text-sm text-green-700 dark:text-green-300">No alerts at this time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <Card 
          key={idx}
          className={
            alert.type === 'error' 
              ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
              : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950'
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {alert.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <div>
                <p className={`font-medium ${
                  alert.type === 'error' 
                    ? 'text-red-900 dark:text-red-100' 
                    : 'text-yellow-900 dark:text-yellow-100'
                }`}>
                  {alert.message}
                </p>
                <p className={`text-sm ${
                  alert.type === 'error'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {alert.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

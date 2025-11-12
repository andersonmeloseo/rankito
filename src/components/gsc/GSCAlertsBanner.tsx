import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'quota' | 'integration' | 'sitemap' | 'indexing';
  severity: 'info' | 'warning' | 'error';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const getSeverityIcon = (severity: AlertItem['severity']) => {
  switch (severity) {
    case 'error': 
      return <AlertCircle className="h-5 w-5" />;
    case 'warning': 
      return <AlertTriangle className="h-5 w-5" />;
    case 'info': 
      return <Info className="h-5 w-5" />;
  }
};

interface GSCAlertsBannerProps {
  alerts?: AlertItem[];
}

export const GSCAlertsBanner = ({ alerts }: GSCAlertsBannerProps) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert 
          key={alert.id} 
          variant={alert.severity === 'error' ? 'destructive' : 'default'}
          className={
            alert.severity === 'warning' 
              ? 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200' 
              : alert.severity === 'info'
              ? 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200'
              : ''
          }
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {getSeverityIcon(alert.severity)}
              <AlertDescription className="text-sm font-medium">
                {alert.message}
              </AlertDescription>
            </div>
            {alert.action && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={alert.action.onClick}
                className="ml-4"
              >
                {alert.action.label}
              </Button>
            )}
          </div>
        </Alert>
      ))}
    </div>
  );
};

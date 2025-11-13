import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar, Gauge, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface QuickAlertsProps {
  userId: string;
}

export const QuickAlerts = ({ userId }: QuickAlertsProps) => {
  const navigate = useNavigate();
  
  const { data: alerts } = useQuery({
    queryKey: ['quick-alerts', userId],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Check expiring contracts
      const { data: expiringContracts } = await supabase
        .from('rank_rent_clients')
        .select('id, name, contract_end_date')
        .eq('user_id', userId)
        .lte('contract_end_date', thirtyDaysFromNow.toISOString())
        .gte('contract_end_date', new Date().toISOString());

      const alerts = [];

      if (expiringContracts && expiringContracts.length > 0) {
        alerts.push({
          id: 'expiring-contracts',
          type: 'warning' as const,
          icon: Calendar,
          title: `${expiringContracts.length} contrato(s) vencendo em breve`,
          description: 'Renovações necessárias nos próximos 30 dias',
          action: () => navigate('/dashboard?tab=clients'),
          actionLabel: 'Ver Clientes',
        });
      }

      return alerts;
    },
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertTriangle className="w-5 h-5" />
          Ações Necessárias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <alert.icon className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {alert.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={alert.action}
              >
                {alert.actionLabel}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

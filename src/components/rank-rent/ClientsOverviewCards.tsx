import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, AlertTriangle, TrendingUp } from "lucide-react";

interface ClientMetric {
  client_id: string;
  client_name: string;
  email?: string;
  phone?: string;
  company?: string;
  niche?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  created_at?: string;
  updated_at?: string;
  access_token?: string;
  total_pages_rented?: number;
  total_monthly_value?: number;
  total_page_views?: number;
  total_conversions?: number;
}

interface ClientsOverviewCardsProps {
  clients: ClientMetric[];
}

export const ClientsOverviewCards = ({ clients }: ClientsOverviewCardsProps) => {
  const totalRevenue = clients.reduce((sum, client) => sum + Number(client.total_monthly_value || 0), 0);
  
  const activeClients = clients.filter(client => {
    if (!client.contract_end_date) return true;
    const daysUntilEnd = Math.ceil((new Date(client.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd >= 0;
  }).length;
  
  const expiringContracts = clients.filter(client => {
    if (!client.contract_end_date) return false;
    const daysUntilEnd = Math.ceil((new Date(client.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd >= 0 && daysUntilEnd <= 30;
  }).length;
  
  const totalPages = clients.reduce((sum, client) => sum + Number(client.total_pages_rented || 0), 0);

  const cards = [
    {
      title: "Receita Mensal",
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Clientes Ativos",
      value: activeClients.toString(),
      subtitle: `de ${clients.length} total`,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Vencendo em 30 dias",
      value: expiringContracts.toString(),
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Total de Páginas",
      value: totalPages.toString(),
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <div className="space-y-1">
                  <h3 className={`text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </h3>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";
import { useEarlyAccessLeads } from "@/hooks/useEarlyAccessLeads";

export const MarketingOverview = () => {
  const { data: leads, isLoading } = useEarlyAccessLeads();

  const totalLeads = leads?.length || 0;
  const pendingLeads = leads?.filter(l => l.status === 'pending').length || 0;
  const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  const metrics = [
    {
      title: "Total de Leads",
      value: totalLeads,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pendentes",
      value: pendingLeads,
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Convertidos",
      value: convertedLeads,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`${metric.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Origem dos Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Gráfico de origem em desenvolvimento...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
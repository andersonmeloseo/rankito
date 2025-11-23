import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEarlyAccessLeads } from "@/hooks/useEarlyAccessLeads";
import { ArrowRight } from "lucide-react";

export const MarketingFunnelChart = () => {
  const { data: leads } = useEarlyAccessLeads();

  const totalLeads = leads?.length || 0;
  const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  const funnelSteps = [
    {
      label: "Visitantes Landing Page",
      value: "~10.000",
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Leads Early Access",
      value: totalLeads,
      percentage: "5%",
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Trials Iniciados",
      value: "—",
      percentage: "30%",
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Clientes Pagantes",
      value: convertedLeads,
      percentage: conversionRate + "%",
      color: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
        <CardDescription>
          Visualização do funil de marketing desde visitantes até clientes pagantes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
          {funnelSteps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className={`${step.color} rounded-xl p-6 text-center min-w-[200px] shadow-md hover:shadow-lg transition-shadow`}>
                <p className="text-sm font-medium mb-2">{step.label}</p>
                <p className="text-4xl font-bold mb-1">{step.value}</p>
                {step.percentage && (
                  <p className="text-xs opacity-75">({step.percentage})</p>
                )}
              </div>
              {index < funnelSteps.length - 1 && (
                <ArrowRight className="h-6 w-6 text-muted-foreground hidden lg:block" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-700 mb-1">Google Ads</p>
              <p className="text-2xl font-bold text-blue-900">—</p>
              <p className="text-xs text-blue-600 mt-1">Em desenvolvimento</p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <p className="text-sm text-purple-700 mb-1">LinkedIn Organic</p>
              <p className="text-2xl font-bold text-purple-900">—</p>
              <p className="text-xs text-purple-600 mt-1">Em desenvolvimento</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <p className="text-sm text-green-700 mb-1">SEO Blog</p>
              <p className="text-2xl font-bold text-green-900">—</p>
              <p className="text-xs text-green-600 mt-1">Em desenvolvimento</p>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <p className="text-sm text-orange-700 mb-1">Referral</p>
              <p className="text-2xl font-bold text-orange-900">—</p>
              <p className="text-xs text-orange-600 mt-1">Em desenvolvimento</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
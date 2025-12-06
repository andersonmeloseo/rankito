import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketingStrategies } from "@/hooks/useMarketingStrategies";
import { useMarketingCampaignsV2 } from "@/hooks/useMarketingCampaignsV2";
import { useMarketingGoals } from "@/hooks/useMarketingGoals";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileSpreadsheet, TrendingUp, DollarSign, Target, Users, PieChart } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F", "#FFBB28", "#FF8042"];

export const MarketingExportsROI = () => {
  const { strategies } = useMarketingStrategies();
  const { campaigns, totalBudget, totalSpent, totalConversions, avgCPA } = useMarketingCampaignsV2();
  const { goals, totalActualConversions, totalTargetConversions } = useMarketingGoals();
  const [isExporting, setIsExporting] = useState(false);

  // Calculate ROI metrics
  const estimatedRevenuePerConversion = 197; // R$ 197 per subscriber
  const totalRevenue = totalActualConversions * estimatedRevenuePerConversion;
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

  // Channel distribution
  const channelData = strategies?.reduce((acc, s) => {
    const channel = s.channel;
    if (!acc[channel]) {
      acc[channel] = { channel, budget: 0, leads: 0, conversions: 0 };
    }
    acc[channel].budget += s.budget_monthly || 0;
    acc[channel].leads += s.target_leads || 0;
    acc[channel].conversions += s.target_conversions || 0;
    return acc;
  }, {} as Record<string, { channel: string; budget: number; leads: number; conversions: number }>);

  const channelChartData = Object.values(channelData || {}).map((d, idx) => ({
    name: d.channel.replace("_", " ").toUpperCase(),
    value: d.budget,
    fill: COLORS[idx % COLORS.length],
  }));

  // Goal progress chart
  const goalChartData = goals?.map((g) => ({
    name: `${g.month}/${g.year}`,
    meta: g.target_conversions,
    atual: g.actual_conversions,
  })) || [];

  const exportLeads = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("early_access_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ws = XLSX.utils.json_to_sheet(
        data?.map((lead) => ({
          Nome: lead.full_name,
          Email: lead.email,
          WhatsApp: lead.whatsapp,
          "Nº Sites": lead.num_sites,
          "Principal Dor": lead.main_pain,
          "Fonte Referral": lead.referral_source,
          Status: lead.status,
          "Data Cadastro": new Date(lead.created_at!).toLocaleDateString("pt-BR"),
        })) || []
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");
      XLSX.writeFile(wb, `leads_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Leads exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar leads");
    } finally {
      setIsExporting(false);
    }
  };

  const exportStrategies = () => {
    if (!strategies) return;
    const ws = XLSX.utils.json_to_sheet(
      strategies.map((s) => ({
        Estratégia: s.name,
        Canal: s.channel,
        Tipo: s.type,
        "Orçamento/mês": s.budget_monthly,
        "Meta Leads": s.target_leads,
        "Meta Conversões": s.target_conversions,
        Status: s.status,
        Prioridade: s.priority,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estratégias");
    XLSX.writeFile(wb, `estrategias_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Estratégias exportadas!");
  };

  const exportCampaigns = () => {
    if (!campaigns) return;
    const ws = XLSX.utils.json_to_sheet(
      campaigns.map((c) => ({
        Campanha: c.name,
        Canal: c.channel,
        Status: c.status,
        Orçamento: c.budget_total,
        Gasto: c.budget_spent,
        Leads: c.leads,
        Conversões: c.conversions,
        CPA: c.cpa,
        ROI: c.roi,
        "UTM Source": c.utm_source,
        "UTM Medium": c.utm_medium,
        "UTM Campaign": c.utm_campaign,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Campanhas");
    XLSX.writeFile(wb, `campanhas_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Campanhas exportadas!");
  };

  return (
    <div className="space-y-6">
      {/* ROI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {roi > 0 ? "+" : ""}{roi.toFixed(1)}%
                </p>
                <p className="text-xs text-green-600">ROI Estimado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Receita Estimada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActualConversions}</p>
                <p className="text-xs text-muted-foreground">Conversões Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {avgCPA.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Custo/Aquisição</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {channelChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={channelChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString()}`} />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Sem dados de orçamento por canal
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progresso das Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={goalChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="meta" name="Meta" fill="#8884d8" />
                  <Bar dataKey="atual" name="Atual" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Sem dados de metas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={exportLeads}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Exportar Leads</h4>
                    <p className="text-sm text-muted-foreground">Lista completa de early access</p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Baixar Excel"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={exportStrategies}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Exportar Estratégias</h4>
                    <p className="text-sm text-muted-foreground">Todas as estratégias configuradas</p>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Excel
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={exportCampaigns}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Exportar Campanhas</h4>
                    <p className="text-sm text-muted-foreground">Métricas de todas as campanhas</p>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Excel
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

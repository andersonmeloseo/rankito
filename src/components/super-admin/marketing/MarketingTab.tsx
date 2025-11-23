import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, TrendingUp, Megaphone, FileText, Download } from "lucide-react";
import { MarketingOverview } from "./MarketingOverview";
import { EarlyAccessLeadsTable } from "./EarlyAccessLeadsTable";
import { MarketingFunnelChart } from "./MarketingFunnelChart";

export const MarketingTab = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-muted">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Lista de Espera</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas de Funil</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Conteúdo & SEO</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MarketingOverview />
        </TabsContent>

        <TabsContent value="leads">
          <EarlyAccessLeadsTable />
        </TabsContent>

        <TabsContent value="funnel">
          <MarketingFunnelChart />
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        </TabsContent>

        <TabsContent value="exports">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
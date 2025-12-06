import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, TrendingUp, Megaphone, FileText, Download, Target, Calendar } from "lucide-react";
import { MarketingOverview } from "./MarketingOverview";
import { EarlyAccessLeadsTable } from "./EarlyAccessLeadsTable";
import { MarketingFunnelChart } from "./MarketingFunnelChart";
import { MarketingPlanManager } from "./MarketingPlanManager";
import { MarketingStrategiesManager } from "./MarketingStrategiesManager";
import { CampaignsManager } from "./CampaignsManager";
import { ContentSEOManager } from "./ContentSEOManager";
import { MarketingExportsROI } from "./MarketingExportsROI";

export const MarketingTab = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="plan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-muted">
          <TabsTrigger value="plan" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Plano</span>
          </TabsTrigger>
          <TabsTrigger value="strategies" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Estratégias</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Conteúdo</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Funil</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">ROI & Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan">
          <MarketingPlanManager />
        </TabsContent>

        <TabsContent value="strategies">
          <MarketingStrategiesManager />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsManager />
        </TabsContent>

        <TabsContent value="content">
          <ContentSEOManager />
        </TabsContent>

        <TabsContent value="overview">
          <MarketingOverview />
        </TabsContent>

        <TabsContent value="leads">
          <EarlyAccessLeadsTable />
        </TabsContent>

        <TabsContent value="funnel">
          <MarketingFunnelChart />
        </TabsContent>

        <TabsContent value="exports">
          <MarketingExportsROI />
        </TabsContent>
      </Tabs>
    </div>
  );
};

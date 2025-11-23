import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Star, FileText, BarChart } from "lucide-react";
import { GBPIntegrationsManager } from "./GBPIntegrationsManager";
import { GBPReviewsManager } from "./GBPReviewsManager";
import { GBPPostsManager } from "./GBPPostsManager";
import { GBPAnalyticsDashboard } from "./GBPAnalyticsDashboard";

interface GBPTabContentProps {
  siteId: string;
  userId: string;
  siteName: string;
}

export const GBPTabContent = ({ siteId, userId, siteName }: GBPTabContentProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Google Business Profile</h2>
        <p className="text-muted-foreground">
          Gerencie avaliações, posts e métricas do seu perfil no Google
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <Star className="w-4 h-4" />
            Avaliações
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="w-4 h-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <GBPIntegrationsManager siteId={siteId} userId={userId} />
        </TabsContent>

        <TabsContent value="reviews">
          <GBPReviewsManager siteId={siteId} />
        </TabsContent>

        <TabsContent value="posts">
          <GBPPostsManager siteId={siteId} />
        </TabsContent>

        <TabsContent value="analytics">
          <GBPAnalyticsDashboard siteId={siteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

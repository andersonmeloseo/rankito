import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Star, FileText, BarChart, Grid3x3 } from "lucide-react";
import { GBPIntegrationsManager } from "./GBPIntegrationsManager";
import { GBPReviewsManager } from "./GBPReviewsManager";
import { GBPPostsManager } from "./GBPPostsManager";
import { GBPAnalyticsDashboard } from "./GBPAnalyticsDashboard";
import { GBPProfilesList } from "./GBPProfilesList";

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

      <Tabs defaultValue="profiles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profiles" className="gap-2">
            <Grid3x3 className="w-4 h-4" />
            Perfis
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
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            Configuração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <GBPProfilesList userId={userId} siteId={siteId} siteName={siteName} />
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

        <TabsContent value="config">
          <GBPIntegrationsManager siteId={siteId} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

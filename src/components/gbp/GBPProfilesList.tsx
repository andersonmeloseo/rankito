import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, MapPin, Phone, Eye, CheckCircle, Link as LinkIcon } from "lucide-react";
import { useGBPSiteProfiles } from "@/hooks/useGBPProfiles";
import { useGBPMockData } from "@/hooks/useGBPMockData";
import { Skeleton } from "@/components/ui/skeleton";
import { GBPMockDataBanner } from "./GBPMockDataBanner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GBPProfileOverview } from "./GBPProfileOverview";
import { GBPPhotosManager } from "./GBPPhotosManager";
import { GBPQuestionsManager } from "./GBPQuestionsManager";
import { GBPProfileEditor } from "./GBPProfileEditor";
import { GBPProfileReviewsManager } from "./GBPProfileReviewsManager";
import { GBPProfilePostsManager } from "./GBPProfilePostsManager";
import { GBPProfileAnalyticsDashboard } from "./GBPProfileAnalyticsDashboard";
import { AddGBPIntegrationDialog } from "./AddGBPIntegrationDialog";

interface GBPProfilesListProps {
  userId: string;
  siteId: string;
  siteName: string;
}

export const GBPProfilesList = ({ userId, siteId, siteName }: GBPProfilesListProps) => {
  const { profiles, isLoading } = useGBPSiteProfiles(siteId, userId);
  const { generateMockData, isGenerating } = useGBPMockData(siteId);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const mockProfiles = profiles?.filter(p => p.is_mock) || [];
  const realProfiles = profiles?.filter(p => !p.is_mock) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-48 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mock Data Banner */}
      {mockProfiles.length > 0 && (
        <GBPMockDataBanner siteId={siteId} profileCount={mockProfiles.length} />
      )}

      {/* Empty State */}
      {!profiles || profiles.length === 0 ? (
        <>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Card 1: Demo Data */}
            <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50" />
              <CardContent className="pt-8 pb-6 px-6 relative">
                <Sparkles className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Dados de Demonstração</h3>
                <p className="text-muted-foreground mb-4">
                  Explore todas as funcionalidades com dados realistas
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>5 perfis completos prontos</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Reviews, fotos e analytics mockados</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Teste todas as funcionalidades</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Perfeito para aprender o sistema</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => generateMockData({ clearExisting: false })}
                  disabled={isGenerating}
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {isGenerating ? "Gerando..." : "Gerar Perfis Demo"}
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: Real Profile */}
            <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50" />
              <CardContent className="pt-8 pb-6 px-6 relative">
                <LinkIcon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Conectar Perfil Real</h3>
                <p className="text-muted-foreground mb-4">
                  Sincronize seu Google Business Profile real
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Sincronização automática</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Reviews e posts reais</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Analytics em tempo real</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Dados do Google My Business</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => setShowConnectDialog(true)}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <LinkIcon className="mr-2 h-5 w-5" />
                  Conectar Primeiro Perfil
                </Button>
              </CardContent>
            </Card>
          </div>

          <AddGBPIntegrationDialog
            open={showConnectDialog}
            onOpenChange={setShowConnectDialog}
            onSuccess={() => {
              setShowConnectDialog(false);
            }}
          />
        </>
      ) : (
        <div className="space-y-8">
          {/* Mock Profiles */}
          {mockProfiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Perfis de Demonstração</h2>
                <Badge variant="secondary">{mockProfiles.length} perfis</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockProfiles.map((profile) => (
                  <Card
                    key={profile.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{profile.business_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{profile.business_address?.split(',')[1]}</span>
                          </div>
                        </div>
                        <Badge variant="outline">Demo</Badge>
                      </div>

                      {profile.average_rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 font-semibold text-sm">
                              {profile.average_rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({profile.total_reviews})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {profile.business_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{profile.business_phone}</span>
                          </div>
                        )}
                      </div>

                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Real Profiles */}
          {realProfiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Perfis Conectados</h2>
                <Badge>{realProfiles.length} perfis</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {realProfiles.map((profile) => (
                  <Card
                    key={profile.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{profile.business_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{profile.business_address?.split(',')[1]}</span>
                          </div>
                        </div>
                      </div>

                      {profile.average_rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 font-semibold text-sm">
                              {profile.average_rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({profile.total_reviews})
                          </span>
                        </div>
                      )}

                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Details Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedProfile?.business_name}
            </DialogTitle>
          </DialogHeader>

          {selectedProfile && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="edit">Editar</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="photos">Fotos</TabsTrigger>
                <TabsTrigger value="questions">Perguntas</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <GBPProfileOverview profile={selectedProfile} />
              </TabsContent>

              <TabsContent value="edit" className="space-y-6">
                <GBPProfileEditor profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <GBPProfileReviewsManager profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="posts" className="space-y-6">
                <GBPProfilePostsManager profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <GBPProfileAnalyticsDashboard profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="photos" className="space-y-6">
                <GBPPhotosManager profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                <GBPQuestionsManager profileId={selectedProfile.id} />
              </TabsContent>

              <TabsContent value="info" className="space-y-6">
                <div className="prose max-w-none">
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedProfile, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

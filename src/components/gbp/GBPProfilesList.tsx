import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, MapPin, Phone, Eye } from "lucide-react";
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

interface GBPProfilesListProps {
  userId: string;
  siteId: string;
  siteName: string;
}

export const GBPProfilesList = ({ userId, siteId, siteName }: GBPProfilesListProps) => {
  const { profiles, isLoading } = useGBPSiteProfiles(siteId, userId);
  const { generateMockData, isGenerating } = useGBPMockData(siteId);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

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
        <Card className="p-12 text-center">
          <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum Perfil Conectado</h3>
          <p className="text-muted-foreground mb-6">
            Comece gerando dados de demonstração ou conecte seu perfil real do Google Business.
          </p>
          <Button
            size="lg"
            onClick={() => generateMockData({ clearExisting: false })}
            disabled={isGenerating}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Gerar Perfis de Demonstração
          </Button>
        </Card>
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="photos">Fotos</TabsTrigger>
                <TabsTrigger value="questions">Perguntas</TabsTrigger>
                <TabsTrigger value="info">Informações</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <GBPProfileOverview profile={selectedProfile} />
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

import { useState } from "react";
import { useTrainingModules } from "@/hooks/useTrainingModules";
import { useTrainingVideos } from "@/hooks/useTrainingVideos";
import { useVideoProgress, useAllVideoProgress } from "@/hooks/useVideoProgress";
import { VideoPlayer } from "./VideoPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Play, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AcademyTab = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const { data: modules, isLoading: modulesLoading } = useTrainingModules();
  const { data: videos } = useTrainingVideos(selectedModuleId || undefined);
  const { data: allProgress } = useAllVideoProgress();
  const { data: currentProgress } = useVideoProgress(selectedVideoId || undefined);

  const selectedVideo = videos?.find((v) => v.id === selectedVideoId);
  const activeModules = modules?.filter((m) => m.is_active);

  // Calcular progresso geral
  const totalVideos = videos?.length || 0;
  const completedVideos = allProgress?.filter((p) => p.completed).length || 0;
  const overallProgress = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

  const isVideoCompleted = (videoId: string) => {
    return allProgress?.some((p) => p.video_id === videoId && p.completed);
  };

  // Auto-selecionar primeiro módulo e vídeo
  if (!selectedModuleId && activeModules && activeModules.length > 0) {
    setSelectedModuleId(activeModules[0].id);
  }

  if (!selectedVideoId && videos && videos.length > 0) {
    setSelectedVideoId(videos[0].id);
  }

  if (modulesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando academia...</p>
      </div>
    );
  }

  if (!activeModules || activeModules.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum conteúdo de treinamento disponível no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar - Módulos e Vídeos */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Seu Progresso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Concluído</span>
              <span className="font-semibold">{completedVideos} de {totalVideos}</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-4">
            {activeModules.map((module) => {
              const moduleVideos = videos?.filter((v) => v.module_id === module.id) || [];
              const completedInModule = moduleVideos.filter((v) => 
                isVideoCompleted(v.id)
              ).length;

              return (
                <Card 
                  key={module.id} 
                  className={`shadow-card cursor-pointer transition-all ${
                    selectedModuleId === module.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => {
                    setSelectedModuleId(module.id);
                    if (moduleVideos.length > 0) {
                      setSelectedVideoId(moduleVideos[0].id);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {completedInModule}/{moduleVideos.length}
                      </Badge>
                    </div>
                    {module.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    )}
                  </CardHeader>

                  {selectedModuleId === module.id && moduleVideos.length > 0 && (
                    <CardContent className="pt-0 space-y-2">
                      {moduleVideos.map((video) => {
                        const completed = isVideoCompleted(video.id);
                        const isSelected = selectedVideoId === video.id;

                        return (
                          <Button
                            key={video.id}
                            variant={isSelected ? "default" : "ghost"}
                            className="w-full justify-start h-auto py-2 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVideoId(video.id);
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              {completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="text-sm truncate flex-1 text-left">
                                {video.title}
                              </span>
                              {!video.is_free && (
                                <Lock className="w-3 h-3 flex-shrink-0" />
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Player */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {selectedVideo ? (
          <>
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{selectedVideo.title}</CardTitle>
                    {selectedVideo.description && (
                      <p className="text-muted-foreground">
                        {selectedVideo.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedVideo.is_free ? "outline" : "default"}>
                      {selectedVideo.is_free ? "Gratuito" : "Premium"}
                    </Badge>
                    {isVideoCompleted(selectedVideo.id) && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Concluído
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <VideoPlayer 
                  video={selectedVideo} 
                  lastPosition={currentProgress?.last_position_seconds || 0}
                />
              </CardContent>
            </Card>

            {/* Próximos vídeos */}
            {videos && videos.length > 1 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Próximos Vídeos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {videos
                    .filter((v) => v.id !== selectedVideoId)
                    .slice(0, 3)
                    .map((video) => (
                      <Button
                        key={video.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => setSelectedVideoId(video.id)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-16 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{video.title}</p>
                            {video.duration_seconds && (
                              <p className="text-xs text-muted-foreground">
                                {Math.floor(video.duration_seconds / 60)}:
                                {(video.duration_seconds % 60).toString().padStart(2, "0")}
                              </p>
                            )}
                          </div>
                          {isVideoCompleted(video.id) && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </Button>
                    ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Selecione um vídeo para começar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

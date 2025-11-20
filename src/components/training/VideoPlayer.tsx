import { useEffect, useRef, useState } from "react";
import { TrainingVideo } from "@/hooks/useTrainingVideos";
import { useUpdateVideoProgress } from "@/hooks/useVideoProgress";
import { Card } from "@/components/ui/card";

interface VideoPlayerProps {
  video: TrainingVideo;
  lastPosition?: number;
}

export const VideoPlayer = ({ video, lastPosition = 0 }: VideoPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(lastPosition);
  const updateProgress = useUpdateVideoProgress();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Salvar progresso a cada 5 segundos
    intervalRef.current = setInterval(() => {
      if (currentTime > 0) {
        updateProgress.mutate({
          videoId: video.id,
          lastPosition: currentTime,
          completed: false,
        });
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTime, video.id]);

  const handleVideoEnd = () => {
    updateProgress.mutate({
      videoId: video.id,
      lastPosition: currentTime,
      completed: true,
    });
  };

  const getEmbedUrl = () => {
    switch (video.video_provider) {
      case "wistia":
        return `https://fast.wistia.net/embed/iframe/${video.video_id}?videoFoam=true&controlsVisibleOnLoad=false`;
      case "youtube":
        return `https://www.youtube.com/embed/${video.video_id}?rel=0&modestbranding=1&start=${Math.floor(lastPosition)}`;
      case "vimeo":
        return `https://player.vimeo.com/video/${video.video_id}?title=0&byline=0&portrait=0#t=${Math.floor(lastPosition)}s`;
      default:
        return "";
    }
  };

  return (
    <Card className="relative overflow-hidden shadow-card" style={{ paddingTop: "56.25%" }}>
      {/* Overlay para proteção contra cópia */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none select-none"
        onContextMenu={(e) => e.preventDefault()}
      />
      
      <iframe
        src={getEmbedUrl()}
        className="absolute top-0 left-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={(e) => {
          const iframe = e.target as HTMLIFrameElement;
          
          // Listener para tempo do vídeo (genérico)
          window.addEventListener("message", (event) => {
            if (event.data.currentTime) {
              setCurrentTime(event.data.currentTime);
            }
            if (event.data.ended) {
              handleVideoEnd();
            }
          });

          // Desabilitar clique direito no iframe
          iframe.contentWindow?.document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
          });
        }}
        style={{
          pointerEvents: "all",
          userSelect: "none",
        }}
      />

      {/* Watermark com email do usuário */}
      <div className="absolute bottom-4 right-4 text-white/20 text-xs font-mono z-20 pointer-events-none select-none">
        {/* Placeholder - seria substituído pelo email real do usuário */}
      </div>
    </Card>
  );
};

import { useState } from "react";
import { Plus, Edit, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTrainingVideos, useDeleteVideo, TrainingVideo } from "@/hooks/useTrainingVideos";
import { useTrainingModules } from "@/hooks/useTrainingModules";
import { VideoDialog } from "./VideoDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const VideosManagementTab = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TrainingVideo | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<TrainingVideo | null>(null);
  
  const { data: modules } = useTrainingModules();
  const { data: videos, isLoading } = useTrainingVideos(
    selectedModuleId === "all" ? undefined : selectedModuleId
  );
  const deleteVideo = useDeleteVideo();

  const handleEdit = (video: TrainingVideo) => {
    setEditingVideo(video);
    setIsDialogOpen(true);
  };

  const handleDelete = (video: TrainingVideo) => {
    setDeletingVideo(video);
  };

  const confirmDelete = () => {
    if (deletingVideo) {
      deleteVideo.mutate(deletingVideo.id);
      setDeletingVideo(null);
    }
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      wistia: "bg-blue-100 text-blue-700",
      youtube: "bg-red-100 text-red-700",
      vimeo: "bg-cyan-100 text-cyan-700",
    };
    return colors[provider as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vídeos de Treinamento</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os vídeos de cada módulo
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Vídeo
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vídeos Cadastrados</CardTitle>
            <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {modules?.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando vídeos...
            </div>
          ) : videos && videos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id} className="h-16">
                    <TableCell className="font-medium">{video.display_order}</TableCell>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>
                      <Badge className={getProviderBadge(video.video_provider)}>
                        {video.video_provider.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {video.duration_seconds 
                        ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.is_active ? "default" : "secondary"}>
                        {video.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.is_free ? "outline" : "default"}>
                        {video.is_free ? "Gratuito" : "Premium"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(video)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(video)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum vídeo cadastrado ainda
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Vídeo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <VideoDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingVideo(null);
        }}
        video={editingVideo}
      />

      <AlertDialog open={!!deletingVideo} onOpenChange={() => setDeletingVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o vídeo "{deletingVideo?.title}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

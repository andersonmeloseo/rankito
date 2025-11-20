import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateVideo, useUpdateVideo, TrainingVideo } from "@/hooks/useTrainingVideos";
import { useTrainingModules } from "@/hooks/useTrainingModules";

interface VideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: TrainingVideo | null;
}

interface FormData {
  module_id: string;
  title: string;
  description: string;
  video_provider: "wistia" | "youtube" | "vimeo";
  video_id: string;
  duration_seconds: number;
  thumbnail_url: string;
  display_order: number;
  is_active: boolean;
  is_free: boolean;
}

export const VideoDialog = ({ open, onOpenChange, video }: VideoDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      module_id: "",
      title: "",
      description: "",
      video_provider: "wistia",
      video_id: "",
      duration_seconds: 0,
      thumbnail_url: "",
      display_order: 0,
      is_active: true,
      is_free: false,
    },
  });

  const { data: modules } = useTrainingModules();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();

  useEffect(() => {
    if (video) {
      reset({
        module_id: video.module_id,
        title: video.title,
        description: video.description || "",
        video_provider: video.video_provider,
        video_id: video.video_id,
        duration_seconds: video.duration_seconds || 0,
        thumbnail_url: video.thumbnail_url || "",
        display_order: video.display_order,
        is_active: video.is_active,
        is_free: video.is_free,
      });
    } else {
      reset({
        module_id: "",
        title: "",
        description: "",
        video_provider: "wistia",
        video_id: "",
        duration_seconds: 0,
        thumbnail_url: "",
        display_order: 0,
        is_active: true,
        is_free: false,
      });
    }
  }, [video, reset]);

  const onSubmit = async (data: FormData) => {
    if (video) {
      await updateVideo.mutateAsync({ id: video.id, ...data });
    } else {
      await createVideo.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const isActive = watch("is_active");
  const isFree = watch("is_free");
  const videoProvider = watch("video_provider");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? "Editar Vídeo" : "Novo Vídeo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="module_id">Módulo *</Label>
              <Select
                value={watch("module_id")}
                onValueChange={(value) => setValue("module_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modules?.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_provider">Plataforma *</Label>
              <Select
                value={videoProvider}
                onValueChange={(value: "wistia" | "youtube" | "vimeo") => 
                  setValue("video_provider", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wistia">Wistia</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Ex: Como criar seu primeiro projeto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descreva o conteúdo do vídeo..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video_id">ID do Vídeo *</Label>
              <Input
                id="video_id"
                {...register("video_id", { required: true })}
                placeholder={
                  videoProvider === "wistia" ? "abc123xyz" :
                  videoProvider === "youtube" ? "dQw4w9WgXcQ" :
                  "123456789"
                }
              />
              <p className="text-xs text-muted-foreground">
                {videoProvider === "wistia" && "ID do vídeo no Wistia"}
                {videoProvider === "youtube" && "ID do vídeo do YouTube (após v=)"}
                {videoProvider === "vimeo" && "Número do vídeo no Vimeo"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_seconds">Duração (segundos)</Label>
              <Input
                id="duration_seconds"
                type="number"
                {...register("duration_seconds", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">URL da Thumbnail</Label>
            <Input
              id="thumbnail_url"
              {...register("thumbnail_url")}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Ordem de Exibição *</Label>
            <Input
              id="display_order"
              type="number"
              {...register("display_order", { required: true, valueAsNumber: true })}
              placeholder="0"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Vídeo Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Desative para ocultar temporariamente
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_free">Acesso Gratuito</Label>
              <p className="text-xs text-muted-foreground">
                Disponível sem assinatura ativa
              </p>
            </div>
            <Switch
              id="is_free"
              checked={isFree}
              onCheckedChange={(checked) => setValue("is_free", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {video ? "Salvar Alterações" : "Adicionar Vídeo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

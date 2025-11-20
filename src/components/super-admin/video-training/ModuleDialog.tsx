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
import { useCreateModule, useUpdateModule, TrainingModule } from "@/hooks/useTrainingModules";

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: TrainingModule | null;
}

interface FormData {
  title: string;
  description: string;
  display_order: number;
  icon: string;
  is_active: boolean;
}

export const ModuleDialog = ({ open, onOpenChange, module }: ModuleDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      display_order: 0,
      icon: "",
      is_active: true,
    },
  });

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();

  useEffect(() => {
    if (module) {
      reset({
        title: module.title,
        description: module.description || "",
        display_order: module.display_order,
        icon: module.icon || "",
        is_active: module.is_active,
      });
    } else {
      reset({
        title: "",
        description: "",
        display_order: 0,
        icon: "",
        is_active: true,
      });
    }
  }, [module, reset]);

  const onSubmit = async (data: FormData) => {
    if (module) {
      await updateModule.mutateAsync({ id: module.id, ...data });
    } else {
      await createModule.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const isActive = watch("is_active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{module ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register("title", { required: true })}
                placeholder="Ex: Introdução ao Sistema"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descreva o conteúdo deste módulo..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ícone (opcional)</Label>
            <Input
              id="icon"
              {...register("icon")}
              placeholder="Ex: BookOpen, Video, Users"
            />
            <p className="text-xs text-muted-foreground">
              Nome do ícone do Lucide React
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Módulo Ativo</Label>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {module ? "Salvar Alterações" : "Criar Módulo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

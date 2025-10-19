import { useState, useEffect } from "react";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, GripVertical, Trash2, Palette } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PipelineStage } from "@/hooks/usePipelineStages";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PipelineSettingsProps {
  userId: string;
}

const colorOptions = [
  { value: "bg-slate-100", label: "Cinza" },
  { value: "bg-blue-100", label: "Azul" },
  { value: "bg-purple-100", label: "Roxo" },
  { value: "bg-yellow-100", label: "Amarelo" },
  { value: "bg-green-100", label: "Verde" },
  { value: "bg-red-100", label: "Vermelho" },
  { value: "bg-orange-100", label: "Laranja" },
  { value: "bg-pink-100", label: "Rosa" },
  { value: "bg-indigo-100", label: "Índigo" },
];

const SortableStageItem = ({ stage, onUpdate, onDelete }: { stage: PipelineStage; onUpdate: any; onDelete: any }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(stage.label);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (label !== stage.label) {
      onUpdate.mutate({ id: stage.id, updates: { label } });
    }
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-background border rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className={`w-8 h-8 rounded ${stage.color}`} />

      <div className="flex-1">
        {isEditing ? (
          <Input value={label} onChange={(e) => setLabel(e.target.value)} onBlur={handleSave} onKeyDown={(e) => e.key === "Enter" && handleSave()} autoFocus className="h-8" />
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium" onDoubleClick={() => !stage.is_system && setIsEditing(true)}>
              {stage.label}
            </span>
            {stage.is_system && <span className="text-xs text-muted-foreground">(Sistema)</span>}
          </div>
        )}
        <span className="text-xs text-muted-foreground">Chave: {stage.stage_key}</span>
      </div>

      <Select value={stage.color} onValueChange={(color) => onUpdate.mutate({ id: stage.id, updates: { color } })}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {colorOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${opt.value}`} />
                {opt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Label htmlFor={`active-${stage.id}`} className="text-xs">
          Ativo
        </Label>
        <Switch id={`active-${stage.id}`} checked={stage.is_active} onCheckedChange={(is_active) => onUpdate.mutate({ id: stage.id, updates: { is_active } })} />
      </div>

      {!stage.is_system && (
        <Button variant="ghost" size="icon" onClick={() => onDelete.mutate(stage.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
};

export const PipelineSettings = ({ userId }: PipelineSettingsProps) => {
  const queryClient = useQueryClient();
  const { stages, isLoading, createStage, updateStage, deleteStage, reorderStages } = usePipelineStages(userId);
  const [newStageKey, setNewStageKey] = useState("");
  const [newStageLabel, setNewStageLabel] = useState("");
  const [newStageColor, setNewStageColor] = useState("bg-slate-100");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // Criar estágios padrão se não existirem
  useEffect(() => {
    if (!isLoading && stages && stages.length === 0 && userId) {
      const createDefaultStages = async () => {
        try {
          const defaultStages = [
            { stage_key: 'lead', label: 'Lead', color: 'bg-slate-100', display_order: 1, is_system: true },
            { stage_key: 'contact', label: 'Contato', color: 'bg-blue-100', display_order: 2, is_system: true },
            { stage_key: 'proposal', label: 'Proposta', color: 'bg-purple-100', display_order: 3, is_system: true },
            { stage_key: 'negotiation', label: 'Negociação', color: 'bg-yellow-100', display_order: 4, is_system: true },
            { stage_key: 'won', label: 'Ganho', color: 'bg-green-100', display_order: 5, is_system: true },
            { stage_key: 'lost', label: 'Perdido', color: 'bg-red-100', display_order: 6, is_system: true },
          ];

          const stagesToInsert = defaultStages.map(stage => ({
            ...stage,
            user_id: userId,
            is_active: true,
          }));

          const { error } = await supabase
            .from('crm_pipeline_stages')
            .insert(stagesToInsert);
          
          if (error) throw error;
          
          queryClient.invalidateQueries({ queryKey: ["pipelineStages", userId] });
          toast.success("Estágios padrão criados com sucesso!");
        } catch (error: any) {
          console.error("Erro ao criar estágios padrão:", error);
          toast.error("Erro ao criar estágios padrão: " + error.message);
        }
      };

      createDefaultStages();
    }
  }, [isLoading, stages, userId, queryClient]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && stages) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(stages, oldIndex, newIndex);
      const updates = reordered.map((stage, index) => ({
        id: stage.id,
        display_order: index + 1,
      }));

      reorderStages.mutate(updates);
    }
  };

  const handleCreateStage = () => {
    if (!newStageKey || !newStageLabel) return;

    createStage.mutate(
      {
        stage_key: newStageKey.toLowerCase().replace(/\s+/g, "_"),
        label: newStageLabel,
        color: newStageColor,
        display_order: (stages?.length || 0) + 1,
        is_active: true,
        is_system: false,
      },
      {
        onSuccess: () => {
          setNewStageKey("");
          setNewStageLabel("");
          setNewStageColor("bg-slate-100");
          setShowCreateDialog(false);
        },
      }
    );
  };

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
          <CardDescription>Usuário não identificado. Faça login novamente.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estágios do Pipeline</CardTitle>
              <CardDescription>Carregando configurações...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Estágios do Pipeline</CardTitle>
                <Badge variant="secondary">{stages?.length || 0} estágios</Badge>
              </div>
              <CardDescription>Configure os estágios do seu funil de vendas. Arraste para reordenar.</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Estágio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Estágio</DialogTitle>
                  <DialogDescription>Adicione um estágio personalizado ao seu pipeline.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stage-key">Chave (identificador único)</Label>
                    <Input id="stage-key" placeholder="ex: qualificacao" value={newStageKey} onChange={(e) => setNewStageKey(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage-label">Nome de Exibição</Label>
                    <Input id="stage-label" placeholder="ex: Qualificação" value={newStageLabel} onChange={(e) => setNewStageLabel(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage-color">Cor</Label>
                    <Select value={newStageColor} onValueChange={setNewStageColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${opt.value}`} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateStage} disabled={!newStageKey || !newStageLabel}>
                    Criar Estágio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!stages || stages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum estágio encontrado. Criando estágios padrão...</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={stages?.map((s) => s.id) || []} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {stages?.map((stage) => (
                    <SortableStageItem key={stage.id} stage={stage} onUpdate={updateStage} onDelete={deleteStage} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Dica:</strong> Estágios marcados como "Sistema" não podem ser removidos, apenas desativados. Duplo-clique no nome para editar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

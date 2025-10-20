import { useState } from "react";
import { useDeals, Deal } from "@/hooks/useDeals";
import { usePipelineStages, PipelineStage } from "@/hooks/usePipelineStages";
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors, DragOverlay, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, Pencil } from "lucide-react";
import { DealCard } from "./cards/DealCard";
import { CreateDealDialog } from "./dialogs/CreateDealDialog";
import { DealDetailsDialog } from "./dialogs/DealDetailsDialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SalesPipelineProps {
  userId: string;
}

const DroppableColumn = ({ 
  stageKey, 
  children 
}: { 
  stageKey: string; 
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stageKey,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`transition-colors ${isOver ? 'bg-accent/5' : ''}`}
    >
      {children}
    </div>
  );
};

const SortableDealCard = ({ 
  deal, 
  onDelete, 
  onOpenDetails 
}: { 
  deal: Deal; 
  onDelete: (id: string) => void;
  onOpenDetails: (deal: Deal) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DealCard 
        deal={deal} 
        onDelete={onDelete} 
        onOpenDetails={onOpenDetails}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

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

const getColorFromClass = (colorClass: string) => {
  const colorMap: Record<string, string> = {
    "bg-slate-100": "#f1f5f9",
    "bg-blue-100": "#dbeafe",
    "bg-purple-100": "#f3e8ff",
    "bg-yellow-100": "#fef3c7",
    "bg-green-100": "#dcfce7",
    "bg-red-100": "#fee2e2",
    "bg-orange-100": "#ffedd5",
    "bg-pink-100": "#fce7f3",
    "bg-indigo-100": "#e0e7ff",
  };
  return colorMap[colorClass] || "#f1f5f9";
};

export const SalesPipeline = ({ userId }: SalesPipelineProps) => {
  const { deals, isLoading, updateDeal, deleteDeal } = useDeals(userId);
  const { stages: pipelineStages, isLoading: stagesLoading, error: stagesError, refetch: refetchStages, updateStage } = usePipelineStages(userId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<"lead" | "contact" | "proposal" | "negotiation" | "won" | "lost">("lead");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dealId = active.id as string;
    const deal = deals?.find((d) => d.id === dealId);
    
    if (!deal) return;

    // Check if dropped over a column (stage_key) or another deal
    let newStage: string;
    
    // If dropped over a stage key directly
    if (pipelineStages?.some(s => s.stage_key === over.id)) {
      newStage = over.id as string;
    } else {
      // If dropped over another deal, find that deal's stage
      const targetDeal = deals?.find((d) => d.id === over.id);
      if (!targetDeal) return;
      newStage = targetDeal.stage;
    }

    if (deal.stage !== newStage) {
      updateDeal({
        id: dealId,
        updates: { stage: newStage as any },
      });
    }
  };

  const activeDeal = deals?.find((d) => d.id === activeId);

  const getDealsByStage = (stage: string) => {
    return deals?.filter((d) => d.stage === stage) || [];
  };

  const getStageTotal = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    return stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  const handleStartEdit = (stage: PipelineStage) => {
    if (stage.is_system) {
      toast({
        title: "Coluna do sistema",
        description: "Esta coluna não pode ser editada.",
        variant: "destructive",
      });
      return;
    }
    setEditingStage(stage.stage_key);
    setEditLabel(stage.label);
    setEditColor(stage.color);
  };

  const handleSaveEdit = (stageId: string) => {
    if (!editLabel.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da coluna não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    
    updateStage.mutate({
      id: stageId,
      updates: {
        label: editLabel.trim(),
        color: editColor,
      },
    });
    
    setEditingStage(null);
  };

  const handleCancelEdit = () => {
    setEditingStage(null);
    setEditLabel("");
    setEditColor("");
  };

  if (isLoading || stagesLoading) {
    return <div className="text-center py-12">Carregando pipeline...</div>;
  }

  // Erro ao carregar estágios
  if (stagesError) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive">Erro ao carregar estágios do pipeline</p>
        <Button onClick={() => refetchStages()}>Tentar Novamente</Button>
      </div>
    );
  }

  const activeStages = pipelineStages?.filter((s) => s.is_active) || [];

  // Nenhum estágio encontrado
  if (activeStages.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Nenhum estágio do pipeline encontrado</p>
        <p className="text-sm text-muted-foreground">
          Os estágios padrão devem ser criados automaticamente. Tente recarregar a página.
        </p>
        <Button onClick={() => refetchStages()}>Recarregar Estágios</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={({ active }) => setActiveId(active.id as string)}>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4 px-1">
            {activeStages.map((stage) => {
            const stageDeals = getDealsByStage(stage.stage_key);
            const stageTotal = getStageTotal(stage.stage_key);

            return (
              <div key={stage.id} className="min-w-[340px] max-w-[340px] flex-shrink-0 inline-block">
                <DroppableColumn stageKey={stage.stage_key}>
                  <SortableContext id={stage.stage_key} items={stageDeals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                      <CardHeader 
                        className="p-4 border-b border-border/40 transition-colors"
                        style={{ 
                          backgroundColor: editingStage === stage.stage_key 
                            ? "hsl(var(--muted))" 
                            : getColorFromClass(stage.color) 
                        }}
                      >
                        {editingStage !== stage.stage_key ? (
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStartEdit(stage)}
                                  className="w-3 h-3 rounded-full hover:ring-2 ring-offset-2 ring-primary transition-all flex-shrink-0"
                                  style={{ backgroundColor: getColorFromClass(stage.color) }}
                                  title="Clique para editar cor"
                                />
                                
                                <CardTitle 
                                  className="text-base font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                                  onDoubleClick={() => handleStartEdit(stage)}
                                >
                                  {stage.label}
                                </CardTitle>
                                
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleStartEdit(stage)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-1.5 mt-1">
                                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-semibold text-muted-foreground">
                                  R$ {stageTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • {stageDeals.length}
                                </span>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-black hover:text-white transition-all"
                              onClick={() => {
                                setSelectedStage(stage.stage_key as any);
                                setShowCreateDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Nome da coluna"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit(stage.id);
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                              />
                            </div>
                            
                            <div className="flex gap-1.5 flex-wrap">
                              {colorOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => setEditColor(option.value)}
                                  className={cn(
                                    "w-6 h-6 rounded-full transition-all hover:scale-110",
                                    editColor === option.value && "ring-2 ring-offset-2 ring-primary"
                                  )}
                                  style={{ backgroundColor: getColorFromClass(option.value) }}
                                  title={option.label}
                                />
                              ))}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(stage.id)}
                                className="flex-1"
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-3 bg-muted/5">
                        <ScrollArea className="h-[calc(100vh-280px)]">
                          <div className="space-y-3 pr-3">
                            {stageDeals.map((deal) => (
                              <SortableDealCard 
                                key={deal.id} 
                                deal={deal} 
                                onDelete={deleteDeal}
                                onOpenDetails={(deal) => {
                                  setSelectedDeal(deal);
                                  setDetailsDialogOpen(true);
                                }}
                              />
                            ))}
                            {stageDeals.length === 0 && (
                              <div className="text-center py-8 text-sm text-muted-foreground">Nenhum deal</div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </SortableContext>
                </DroppableColumn>
              </div>
            );
          })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeDeal ? (
            <div className="rotate-2 shadow-2xl">
              <DealCard deal={activeDeal} onDelete={() => {}} onOpenDetails={() => {}} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateDealDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} userId={userId} initialStage={selectedStage} />
      
      <DealDetailsDialog
        deal={selectedDeal}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        userId={userId}
      />
    </div>
  );
};

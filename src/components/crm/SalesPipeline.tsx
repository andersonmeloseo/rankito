import { useState } from "react";
import { useDeals, Deal } from "@/hooks/useDeals";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DealCard } from "./cards/DealCard";
import { CreateDealDialog } from "./dialogs/CreateDealDialog";
import { DealDetailsDialog } from "./dialogs/DealDetailsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SalesPipelineProps {
  userId: string;
}

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
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} onDelete={onDelete} onOpenDetails={onOpenDetails} />
    </div>
  );
};

export const SalesPipeline = ({ userId }: SalesPipelineProps) => {
  const { deals, isLoading, updateDeal, deleteDeal } = useDeals(userId);
  const { stages: pipelineStages, isLoading: stagesLoading, error: stagesError, refetch: refetchStages } = usePipelineStages(userId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<"lead" | "contact" | "proposal" | "negotiation" | "won" | "lost">("lead");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

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
    const newStage = over.id as "lead" | "contact" | "proposal" | "negotiation" | "won" | "lost";

    const deal = deals?.find((d) => d.id === dealId);
    if (deal && deal.stage !== newStage) {
      updateDeal({
        id: dealId,
        updates: { stage: newStage },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {activeStages.map((stage) => {
            const stageDeals = getDealsByStage(stage.stage_key);
            const stageTotal = getStageTotal(stage.stage_key);

            return (
              <SortableContext key={stage.id} id={stage.stage_key} items={stageDeals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                <Card className={stage.color}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-semibold">
                        {stage.label} ({stageDeals.length})
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setSelectedStage(stage.stage_key as any);
                          setShowCreateDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">
                      R$ {stageTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-[600px] pr-2">
                      <div className="space-y-2">
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
            );
          })}
        </div>

        <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} onDelete={() => {}} onOpenDetails={() => {}} /> : null}</DragOverlay>
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

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Eye, EyeOff, Pencil, Trash2, Search } from "lucide-react";
import { useBacklogItems, BacklogItem } from "@/hooks/useBacklogItems";
import { CreateBacklogItemDialog } from "./CreateBacklogItemDialog";
import { EditBacklogItemDialog } from "./EditBacklogItemDialog";
import { ViewBacklogItemDialog } from "./ViewBacklogItemDialog";
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

const statusColumns = [
  { key: 'planned', label: 'Planejado', color: 'bg-blue-500' },
  { key: 'in_progress', label: 'Em Progresso', color: 'bg-yellow-500' },
  { key: 'testing', label: 'Teste', color: 'bg-purple-500' },
  { key: 'completed', label: 'Concluído', color: 'bg-green-500' },
] as const;

const categoryLabels = {
  new_feature: 'Nova Feature',
  improvement: 'Melhoria',
  bugfix: 'Correção',
  security: 'Segurança',
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const priorityColors = {
  low: 'bg-gray-500 text-white',
  medium: 'bg-blue-500 text-white',
  high: 'bg-red-500 text-white',
  critical: 'bg-red-700 text-white',
};

export const BacklogKanban = () => {
  const { items, isLoading, updateItem, deleteItem } = useBacklogItems();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BacklogItem | null>(null);
  const [viewItem, setViewItem] = useState<BacklogItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('itemId', itemId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    updateItem({ id: itemId, status: status as any });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const togglePublic = (item: BacklogItem) => {
    updateItem({ id: item.id, is_public: !item.is_public });
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Feature
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => (
          <div
            key={column.key}
            onDrop={(e) => handleDrop(e, column.key)}
            onDragOver={handleDragOver}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {items.filter((i) => i.status === column.key).length}
              </Badge>
            </div>

            <div className="space-y-2">
              {items
                .filter((item) => item.status === column.key)
                .map((item) => (
                  <Card
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    className="cursor-move hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {item.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => togglePublic(item)}
                        >
                          {item.is_public ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="flex gap-1 flex-wrap">
                        <Badge className={`text-[10px] border-0 ${priorityColors[item.priority]}`}>
                          {priorityLabels[item.priority]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabels[item.category]}
                        </Badge>
                        {item.release_version && (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.release_version}
                          </Badge>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${item.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {item.progress_percentage}%
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => setViewItem(item)}
                              >
                                <Search className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Visualizar detalhes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => setEditItem(item)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setDeleteConfirm(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      <CreateBacklogItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {editItem && (
        <EditBacklogItemDialog
          item={editItem}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
        />
      )}

      {viewItem && (
        <ViewBacklogItemDialog
          item={viewItem}
          open={!!viewItem}
          onOpenChange={(open) => !open && setViewItem(null)}
        />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta feature? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) deleteItem(deleteConfirm);
                setDeleteConfirm(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

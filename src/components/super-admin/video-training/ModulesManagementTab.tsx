import { useState } from "react";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
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
import { useTrainingModules, useDeleteModule } from "@/hooks/useTrainingModules";
import { ModuleDialog } from "./ModuleDialog";
import { TrainingModule } from "@/hooks/useTrainingModules";
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

export const ModulesManagementTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [deletingModule, setDeletingModule] = useState<TrainingModule | null>(null);
  
  const { data: modules, isLoading } = useTrainingModules();
  const deleteModule = useDeleteModule();

  const handleEdit = (module: TrainingModule) => {
    setEditingModule(module);
    setIsDialogOpen(true);
  };

  const handleDelete = (module: TrainingModule) => {
    setDeletingModule(module);
  };

  const confirmDelete = () => {
    if (deletingModule) {
      deleteModule.mutate(deletingModule.id);
      setDeletingModule(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Módulos de Treinamento</h3>
          <p className="text-sm text-muted-foreground">
            Organize seus vídeos em módulos
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Módulo
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Módulos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando módulos...
            </div>
          ) : modules && modules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.id} className="h-16">
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell className="font-medium">{module.display_order}</TableCell>
                    <TableCell className="font-medium">{module.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {module.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={module.is_active ? "default" : "secondary"}>
                        {module.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(module)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(module)}
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
                Nenhum módulo cadastrado ainda
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Módulo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ModuleDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingModule(null);
        }}
        module={editingModule}
      />

      <AlertDialog open={!!deletingModule} onOpenChange={() => setDeletingModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o módulo "{deletingModule?.title}"? 
              Todos os vídeos associados também serão excluídos. Esta ação não pode ser desfeita.
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

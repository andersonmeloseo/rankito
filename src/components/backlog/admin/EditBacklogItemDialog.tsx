import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useBacklogItems, BacklogItem } from "@/hooks/useBacklogItems";

interface EditBacklogItemDialogProps {
  item: BacklogItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditBacklogItemDialog = ({ item, open, onOpenChange }: EditBacklogItemDialogProps) => {
  const { updateItem } = useBacklogItems();
  const [formData, setFormData] = useState(item);

  useEffect(() => {
    setFormData(item);
  }, [item]);

  const handleSubmit = () => {
    updateItem(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Funcionalidade</DialogTitle>
          <DialogDescription>
            Atualize os dados da funcionalidade no roadmap
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_feature">Nova Funcionalidade</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                  <SelectItem value="bugfix">Correção</SelectItem>
                  <SelectItem value="security">Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planejado</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="testing">Teste</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Progresso: {formData.progress_percentage}%</Label>
            <Slider
              value={[formData.progress_percentage]}
              onValueChange={([value]) => setFormData({ ...formData, progress_percentage: value })}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Início Prevista</Label>
              <Input
                type="date"
                value={formData.estimated_start_date || ''}
                onChange={(e) => setFormData({ ...formData, estimated_start_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Data Fim Prevista</Label>
              <Input
                type="date"
                value={formData.estimated_end_date || ''}
                onChange={(e) => setFormData({ ...formData, estimated_end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Início Real</Label>
              <Input
                type="date"
                value={formData.actual_start_date || ''}
                onChange={(e) => setFormData({ ...formData, actual_start_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Data Fim Real</Label>
              <Input
                type="date"
                value={formData.actual_end_date || ''}
                onChange={(e) => setFormData({ ...formData, actual_end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Versão Release</Label>
            <Input
              value={formData.release_version || ''}
              onChange={(e) => setFormData({ ...formData, release_version: e.target.value })}
              placeholder="ex: v2.1.0"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base">Tornar Público</Label>
              <p className="text-sm text-muted-foreground">
                Funcionalidade será visível no roadmap para usuários
              </p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

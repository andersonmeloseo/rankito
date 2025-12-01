import { useState } from "react";
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
import { useBacklogItems } from "@/hooks/useBacklogItems";
import { useFeatureRequests, FeatureRequest } from "@/hooks/useFeatureRequests";

interface AcceptRequestDialogProps {
  request: FeatureRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AcceptRequestDialog = ({ request, open, onOpenChange }: AcceptRequestDialogProps) => {
  const { createItem } = useBacklogItems();
  const { updateRequest } = useFeatureRequests(true);
  
  const [formData, setFormData] = useState({
    title: request.title,
    description: request.description,
    category: 'new_feature' as any,
    priority: 'medium' as any,
    estimated_end_date: '',
    release_version: '',
  });

  const handleAccept = async () => {
    // Cria item no backlog
    createItem({
      ...formData,
      status: 'planned',
      is_public: true,
    });

    // Atualiza solicitação
    updateRequest({
      id: request.id,
      status: 'accepted',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aceitar Solicitação</DialogTitle>
          <DialogDescription>
            Criar feature no backlog a partir desta solicitação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="new_feature">Nova Feature</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                  <SelectItem value="bugfix">Correção</SelectItem>
                  <SelectItem value="security">Segurança</SelectItem>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Prevista</Label>
              <Input
                type="date"
                value={formData.estimated_end_date}
                onChange={(e) => setFormData({ ...formData, estimated_end_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Versão Release</Label>
              <Input
                value={formData.release_version}
                onChange={(e) => setFormData({ ...formData, release_version: e.target.value })}
                placeholder="ex: v2.2.0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAccept}>
            Aceitar e Criar Feature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

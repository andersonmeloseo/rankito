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
import { useFeatureRequests } from "@/hooks/useFeatureRequests";

interface RequestFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestFeatureDialog = ({ open, onOpenChange }: RequestFeatureDialogProps) => {
  const { createRequest } = useFeatureRequests(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'new_feature' as 'new_feature' | 'improvement' | 'integration' | 'other',
  });

  const handleSubmit = () => {
    createRequest(formData);
    onOpenChange(false);
    setFormData({
      title: '',
      description: '',
      category: 'new_feature',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Solicitar Nova Funcionalidade</DialogTitle>
          <DialogDescription>
            Descreva sua ideia ou sugestão para melhorarmos a plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Solicitação *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Integração com WhatsApp Business"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição Detalhada *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva sua ideia com o máximo de detalhes possível..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quanto mais detalhes, melhor conseguimos entender sua necessidade
            </p>
          </div>

          <div>
            <Label>Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_feature">Nova Funcionalidade</SelectItem>
                <SelectItem value="improvement">Melhoria em Feature Existente</SelectItem>
                <SelectItem value="integration">Integração com Ferramenta Externa</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.description}
          >
            Enviar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

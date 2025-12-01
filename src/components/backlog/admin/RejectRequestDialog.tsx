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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureRequests, FeatureRequest } from "@/hooks/useFeatureRequests";

interface RejectRequestDialogProps {
  request: FeatureRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RejectRequestDialog = ({ request, open, onOpenChange }: RejectRequestDialogProps) => {
  const { updateRequest } = useFeatureRequests(true);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    updateRequest({
      id: request.id,
      status: 'rejected',
      rejection_reason: rejectionReason,
      admin_notes: rejectionReason,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar Solicitação</DialogTitle>
          <DialogDescription>
            Informe o motivo interno da rejeição (não será visível para o usuário)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="font-medium">Solicitação:</Label>
            <p className="text-sm text-muted-foreground mt-1">{request.title}</p>
          </div>

          <div>
            <Label htmlFor="reason">Motivo Interno *</Label>
            <Textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Este motivo não será exibido para o usuário, apenas para controle interno
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={!rejectionReason}
          >
            Rejeitar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

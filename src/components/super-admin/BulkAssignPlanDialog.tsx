import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BulkAssignPlanDialogProps {
  users: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (planId: string) => void;
}

export const BulkAssignPlanDialog = ({ users, open, onOpenChange, onConfirm }: BulkAssignPlanDialogProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const queryClient = useQueryClient();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  const handleConfirm = async () => {
    if (!selectedPlanId) return;
    
    setAssigning(true);
    try {
      await onConfirm(selectedPlanId);
      
      // Force refetch
      await queryClient.invalidateQueries({ queryKey: ['saas-users'] });
      
      onOpenChange(false);
      setSelectedPlanId("");
    } catch (error) {
      console.error('Erro ao atribuir plano:', error);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Atribuir Plano em Massa
          </DialogTitle>
          <DialogDescription>
            Selecione um plano para atribuir a {users.length} usuário{users.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Plano de Assinatura</Label>
            {plansLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando planos...
              </div>
            ) : (
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price}/{plan.billing_period === 'monthly' ? 'mês' : 'ano'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Usuários selecionados:</span>
              <Badge variant="secondary">{users.length}</Badge>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {users.map((user) => (
                <div key={user.id} className="text-sm text-muted-foreground">
                  • {user.full_name || user.email}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-primary/10 p-3 text-sm">
            <p>
              <strong>Atenção:</strong> O plano será atribuído imediatamente e começará a valer a partir de hoje
              com período de 30 dias.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assigning}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPlanId || assigning}>
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atribuir Plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

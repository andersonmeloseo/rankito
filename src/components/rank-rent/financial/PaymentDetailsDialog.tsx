import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePayments } from "@/hooks/usePayments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface PaymentDetailsDialogProps {
  paymentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentDetailsDialog = ({ paymentId, open, onOpenChange }: PaymentDetailsDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<'pending' | 'paid' | 'overdue' | 'cancelled'>('pending');
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_payments")
        .select(`
          *,
          rank_rent_sites(site_name, site_url),
          rank_rent_clients(name, email, phone)
        `)
        .eq("id", paymentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!paymentId,
  });

  const { updatePayment, markAsPaid } = usePayments(payment?.user_id || '');

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setDueDate(payment.due_date);
      setStatus(payment.status as any);
      setPaymentDate(payment.payment_date || "");
      setPaymentMethod(payment.payment_method || "");
      setNotes(payment.notes || "");
    }
  }, [payment]);

  const handleSave = async () => {
    if (!payment) return;

    await updatePayment.mutateAsync({
      id: payment.id,
      amount: Number(amount),
      due_date: dueDate,
      status,
      payment_date: paymentDate || null,
      payment_method: paymentMethod || null,
      notes: notes || null,
    });

    setIsEditing(false);
  };

  const handleMarkAsPaid = async () => {
    if (!payment) return;
    
    await markAsPaid.mutateAsync({
      id: payment.id,
      paymentDate: paymentDate || undefined,
      paymentMethod: paymentMethod || undefined,
    });
    
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "Pago", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      overdue: { label: "Atrasado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading || !payment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Pagamento</span>
            {!isEditing && getStatusBadge(payment.status)}
          </DialogTitle>
          <DialogDescription>
            Referência: {format(new Date(payment.due_date), "MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Site Info */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-2">Informações do Site</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Site:</span>
                <p className="font-medium">{payment.rank_rent_sites?.site_name}</p>
              </div>
              {payment.rank_rent_clients && (
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium">{payment.rank_rent_clients.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Valor (R$)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">Vencimento</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === 'paid' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-paymentDate">Data do Pagamento</Label>
                    <Input
                      id="edit-paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-paymentMethod">Método</Label>
                    <Input
                      id="edit-paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="PIX, TED, Dinheiro..."
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <p className="text-2xl font-bold">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Vencimento</span>
                  <p className="text-lg font-medium">
                    {format(new Date(payment.due_date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              {payment.payment_date && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Data do Pagamento</span>
                    <p className="font-medium">
                      {format(new Date(payment.payment_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  {payment.payment_method && (
                    <div>
                      <span className="text-sm text-muted-foreground">Método</span>
                      <p className="font-medium">{payment.payment_method}</p>
                    </div>
                  )}
                </div>
              )}

              {payment.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Observações</span>
                  <p className="mt-1 text-sm">{payment.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={updatePayment.isPending}>
                  {updatePayment.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
                {payment.status === 'pending' && (
                  <Button
                    variant="default"
                    onClick={handleMarkAsPaid}
                    disabled={markAsPaid.isPending}
                  >
                    {markAsPaid.isPending ? "Processando..." : "Marcar como Pago"}
                  </Button>
                )}
                <Button onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

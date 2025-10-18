import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePayments } from "@/hooks/usePayments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CreatePaymentDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePaymentDialog = ({ userId, open, onOpenChange }: CreatePaymentDialogProps) => {
  const [siteId, setSiteId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState("");
  
  const { createPayment } = usePayments(userId);

  const { data: rentedSites } = useQuery({
    queryKey: ["rented-sites", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_sites")
        .select("id, site_name, monthly_rent_value, client_id, rank_rent_clients(name)")
        .eq("user_id", userId)
        .eq("is_rented", true)
        .order("site_name");

      if (error) throw error;
      return data;
    },
    enabled: open && !!userId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!siteId || !amount || !dueDate) return;

    const selectedSite = rentedSites?.find(s => s.id === siteId);
    if (!selectedSite) return;

    const referenceMonth = format(new Date(dueDate), 'yyyy-MM');

    await createPayment.mutateAsync({
      user_id: userId,
      site_id: siteId,
      client_id: selectedSite.client_id,
      amount: Number(amount),
      due_date: dueDate,
      status: 'pending',
      reference_month: referenceMonth,
      notes: notes || null,
      payment_date: null,
      payment_method: null,
    });

    // Reset form
    setSiteId("");
    setAmount("");
    setDueDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes("");
    onOpenChange(false);
  };

  const handleSiteChange = (newSiteId: string) => {
    setSiteId(newSiteId);
    const site = rentedSites?.find(s => s.id === newSiteId);
    if (site?.monthly_rent_value) {
      setAmount(site.monthly_rent_value.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
          <DialogDescription>
            Registre uma nova mensalidade para um site alugado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site">Site / Cliente *</Label>
            <Select value={siteId} onValueChange={handleSiteChange} required>
              <SelectTrigger id="site">
                <SelectValue placeholder="Selecione um site" />
              </SelectTrigger>
              <SelectContent>
                {rentedSites?.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.site_name}
                    {site.rank_rent_clients && ` - ${site.rank_rent_clients.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rentedSites?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum site alugado disponível. Alugue um site primeiro.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de Vencimento *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre este pagamento..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPayment.isPending || !siteId || !amount || !dueDate}
            >
              {createPayment.isPending ? "Criando..." : "Criar Cobrança"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

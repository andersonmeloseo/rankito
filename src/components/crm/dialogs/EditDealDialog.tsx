import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useDeals, Deal } from "@/hooks/useDeals";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const dealSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  value: z.number().min(0, "Valor deve ser positivo"),
  stage: z.string().min(1, "Estágio é obrigatório"),
  probability: z.number().min(0).max(100),
  expected_close_date: z.string().optional(),
  site_id: z.string().optional(),
  target_niche: z.string().optional(),
  target_location: z.string().optional(),
  source: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  lost_reason: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface EditDealDialogProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function EditDealDialog({ deal, open, onOpenChange, userId }: EditDealDialogProps) {
  const { updateDeal } = useDeals(userId);
  const { stages } = usePipelineStages(userId);
  
  const { data: sites } = useQuery({
    queryKey: ['sites-for-deals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_sites')
        .select('id, site_name, niche, location')
        .eq('owner_user_id', userId)
        .order('site_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      description: "",
      value: 0,
      stage: "lead",
      probability: 0,
      expected_close_date: "",
      site_id: "",
      target_niche: "",
      target_location: "",
      source: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      lost_reason: "",
    },
  });

  useEffect(() => {
    if (deal) {
      form.reset({
        title: deal.title,
        description: deal.description || "",
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date || "",
        site_id: deal.site_id || "",
        target_niche: deal.target_niche || "",
        target_location: deal.target_location || "",
        source: deal.source || "",
        contact_name: deal.contact_name || "",
        contact_email: deal.contact_email || "",
        contact_phone: deal.contact_phone || "",
        lost_reason: deal.lost_reason || "",
      });
    }
  }, [deal, form]);

  const selectedSiteId = form.watch("site_id");
  
  useEffect(() => {
    if (selectedSiteId && sites) {
      const selectedSite = sites.find(s => s.id === selectedSiteId);
      if (selectedSite) {
        form.setValue("target_niche", selectedSite.niche || "");
        form.setValue("target_location", selectedSite.location || "");
      }
    }
  }, [selectedSiteId, sites, form]);

  const onSubmit = (data: DealFormData) => {
    if (!deal) return;

    updateDeal({
      id: deal.id,
      updates: {
        title: data.title,
        description: data.description || null,
        value: Number(data.value),
        stage: data.stage as any,
        probability: Number(data.probability),
        expected_close_date: data.expected_close_date || null,
        site_id: data.site_id || null,
        target_niche: data.target_niche || null,
        target_location: data.target_location || null,
        source: data.source || null,
        contact_name: data.contact_name || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        lost_reason: data.lost_reason || null,
      },
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Deal</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Novo cliente para nicho X" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Detalhes sobre o deal..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probabilidade (%) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                        placeholder="0-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estágio *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages?.map((stage) => (
                          <SelectItem key={stage.id} value={stage.stage_key}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Esperada de Fechamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="site_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Associado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um site (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {sites?.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.site_name} - {site.niche}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_niche"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nicho Alvo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Advocacia" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização Alvo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: São Paulo, SP" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Como chegou até você?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound (chegou até mim)</SelectItem>
                      <SelectItem value="outbound">Outbound (prospecção ativa)</SelectItem>
                      <SelectItem value="referral">Indicação</SelectItem>
                      <SelectItem value="organic">Orgânico (SEO/site)</SelectItem>
                      <SelectItem value="paid">Pago (anúncios)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Informações de Contato</h3>
              
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Contato</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="email@exemplo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 00000-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {form.watch("stage") === "lost" && (
              <FormField
                control={form.control}
                name="lost_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Perda</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Por que o deal foi perdido?" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

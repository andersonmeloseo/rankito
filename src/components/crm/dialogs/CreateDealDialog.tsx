import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDeals } from "@/hooks/useDeals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const dealSchema = z.object({
  site_id: z.string().optional(),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  value: z.coerce.number().min(0),
  stage: z.enum(["lead", "contact", "proposal", "negotiation", "won", "lost"]),
  probability: z.coerce.number().min(0).max(100),
  expected_close_date: z.date().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  target_niche: z.string().optional(),
  target_location: z.string().optional(),
  source: z.string().optional(),
  lost_reason: z.string().optional(),
  card_color: z.string().optional(),
});

const cardColors = [
  { value: "default", bg: "bg-white dark:bg-card", label: "Padrão", preview: "#ffffff" },
  { value: "red", bg: "bg-red-50 dark:bg-red-950/30", label: "Vermelho", preview: "#fef2f2" },
  { value: "orange", bg: "bg-orange-50 dark:bg-orange-950/30", label: "Laranja", preview: "#fff7ed" },
  { value: "yellow", bg: "bg-yellow-50 dark:bg-yellow-950/30", label: "Amarelo", preview: "#fefce8" },
  { value: "green", bg: "bg-green-50 dark:bg-green-950/30", label: "Verde", preview: "#f0fdf4" },
  { value: "blue", bg: "bg-blue-50 dark:bg-blue-950/30", label: "Azul", preview: "#eff6ff" },
  { value: "purple", bg: "bg-purple-50 dark:bg-purple-950/30", label: "Roxo", preview: "#faf5ff" },
  { value: "pink", bg: "bg-pink-50 dark:bg-pink-950/30", label: "Rosa", preview: "#fdf2f8" },
  { value: "gray", bg: "bg-gray-50 dark:bg-gray-950/30", label: "Cinza", preview: "#f9fafb" },
];

type DealFormData = z.infer<typeof dealSchema>;

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialStage?: "lead" | "contact" | "proposal" | "negotiation" | "won" | "lost";
}

export const CreateDealDialog = ({ open, onOpenChange, userId, initialStage = "lead" }: CreateDealDialogProps) => {
  const { createDeal } = useDeals(userId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: sites } = useQuery({
    queryKey: ["sites", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_sites")
        .select("id, site_name, niche, location")
        .eq("owner_user_id", userId)
        .order("site_name");

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      site_id: "",
      title: "",
      description: "",
      value: 0,
      stage: initialStage,
      probability: 0,
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      target_niche: "",
      target_location: "",
      source: "",
      card_color: "default",
    },
  });

  const selectedStage = form.watch("stage");
  const selectedSiteId = form.watch("site_id");

  useEffect(() => {
    if (selectedSiteId && selectedSiteId !== "none") {
      const selectedSite = sites?.find((s) => s.id === selectedSiteId);
      if (selectedSite) {
        form.setValue("target_niche", selectedSite.niche);
        form.setValue("target_location", selectedSite.location);
      }
    }
  }, [selectedSiteId, sites, form]);

  const onSubmit = async (data: DealFormData) => {
    setIsSubmitting(true);
    try {
      await createDeal({
        user_id: userId,
        site_id: data.site_id && data.site_id !== "none" ? data.site_id : null,
        title: data.title,
        description: data.description || null,
        value: data.value,
        stage: data.stage,
        probability: data.probability,
        expected_close_date: data.expected_close_date?.toISOString().split('T')[0] || null,
        contact_name: data.contact_name || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        target_niche: data.target_niche || null,
        target_location: data.target_location || null,
        source: data.source || null,
        lost_reason: selectedStage === "lost" ? data.lost_reason || null : null,
        card_color: data.card_color || "default",
        client_id: null,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Deal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="site_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Relacionado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum (prospect genérico)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (prospect genérico)</SelectItem>
                      {sites?.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.site_name} - {site.niche} ({site.location})
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Deal com Cliente X" {...field} />
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
                    <Textarea placeholder="Detalhes do deal..." {...field} />
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
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                    <FormLabel>Probabilidade (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" placeholder="0" {...field} />
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
                    <FormLabel>Estágio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="contact">Contato</SelectItem>
                        <SelectItem value="proposal">Proposta</SelectItem>
                        <SelectItem value="negotiation">Negociação</SelectItem>
                        <SelectItem value="won">Ganho</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
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
                    <FormLabel>Data Prevista</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_niche"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nicho</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Advogados" {...field} />
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
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo" {...field} />
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
                  <FormLabel>Origem</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Indicação</SelectItem>
                      <SelectItem value="social">Redes Sociais</SelectItem>
                      <SelectItem value="cold">Cold Call</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
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
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do contato" {...field} />
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
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="card_color"
              render={({ field }) => (
                <FormItem className="border-t pt-4">
                  <FormLabel>Cor do Card</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {cardColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => field.onChange(color.value)}
                          className={cn(
                            "w-10 h-10 rounded-md border-2 transition-all hover:scale-110",
                            field.value === color.value
                              ? "border-primary ring-2 ring-offset-2 ring-primary"
                              : "border-border"
                          )}
                          style={{ backgroundColor: color.preview }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStage === "lost" && (
              <FormField
                control={form.control}
                name="lost_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Perda</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Por que este deal foi perdido?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Deal"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

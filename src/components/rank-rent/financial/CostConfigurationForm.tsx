import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import type { FinancialConfig } from "@/hooks/useFinancialMetrics";

const formSchema = z.object({
  business_model: z.enum(["per_page", "full_site"]),
  cost_per_conversion: z.coerce.number().min(0, "Valor não pode ser negativo"),
  monthly_fixed_costs: z.coerce.number().min(0, "Valor não pode ser negativo"),
  acquisition_cost: z.coerce.number().min(0, "Valor não pode ser negativo"),
  notes: z.string().optional(),
});

interface CostConfigurationFormProps {
  config: FinancialConfig | null;
  onSave: (config: FinancialConfig) => void;
  isSaving: boolean;
}

export const CostConfigurationForm = ({ config, onSave, isSaving }: CostConfigurationFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_model: config?.business_model || "full_site",
      cost_per_conversion: config?.cost_per_conversion || 0,
      monthly_fixed_costs: config?.monthly_fixed_costs || 0,
      acquisition_cost: config?.acquisition_cost || 0,
      notes: config?.notes || "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values as FinancialConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Custos</CardTitle>
        <CardDescription>
          Configure seus custos operacionais para calcular o ROI e lucratividade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="business_model"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Modelo de Negócio</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full_site" id="full_site" />
                        <Label htmlFor="full_site" className="font-normal cursor-pointer">
                          Site Completo - Alugo o site inteiro para um cliente
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="per_page" id="per_page" />
                        <Label htmlFor="per_page" className="font-normal cursor-pointer">
                          Por Página - Alugo páginas individuais para diferentes clientes
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Escolha como você monetiza este site
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost_per_conversion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo por Conversão (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Quanto custa cada lead/conversão gerada (ex: CPC, anúncios)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthly_fixed_costs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custos Fixos Mensais (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Hospedagem, domínio, ferramentas, manutenção
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acquisition_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo de Aquisição (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Investimento inicial para criar/comprar o site
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre os custos..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configuração
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

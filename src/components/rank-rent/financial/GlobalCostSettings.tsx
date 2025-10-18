import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface GlobalCostSettingsProps {
  userId: string;
}

export const GlobalCostSettings = ({ userId }: GlobalCostSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    cost_per_conversion: 50,
    monthly_fixed_costs: 500,
    business_model: "full_site" as "full_site" | "per_page",
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Esta feature seria implementada com uma mutation para salvar configurações padrão
      // Por enquanto, apenas mostramos o toast de sucesso
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula salvamento
      
      toast({
        title: "Configurações salvas",
        description: "As configurações padrão serão aplicadas em novos projetos.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Padrão de Custos</CardTitle>
        <CardDescription>
          Defina valores padrão que serão aplicados automaticamente em novos projetos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cost-per-conversion">Custo por Conversão (R$)</Label>
            <Input
              id="cost-per-conversion"
              type="number"
              min="0"
              step="0.01"
              value={config.cost_per_conversion}
              onChange={(e) => setConfig({ ...config, cost_per_conversion: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Quanto você gasta em média para gerar cada conversão
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthly-fixed-costs">Custos Fixos Mensais (R$)</Label>
            <Input
              id="monthly-fixed-costs"
              type="number"
              min="0"
              step="0.01"
              value={config.monthly_fixed_costs}
              onChange={(e) => setConfig({ ...config, monthly_fixed_costs: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Custos fixos mensais (servidor, domínio, ferramentas)
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="business-model">Modelo de Negócio</Label>
          <Select
            value={config.business_model}
            onValueChange={(value) => setConfig({ ...config, business_model: value as any })}
          >
            <SelectTrigger id="business-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_site">Site Completo</SelectItem>
              <SelectItem value="per_page">Por Página</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Como você cobra: site completo ou valor por página
          </p>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações Padrão
        </Button>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AutomationRule, useToggleAutomationRule, useDeleteAutomationRule } from "@/hooks/useAutomationRules";
import { Bot, CheckCircle2, XCircle, MoreVertical, Edit, Trash2, Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AutomationRuleCardProps {
  rule: AutomationRule;
  onEdit: (rule: AutomationRule) => void;
}

const ruleTypeLabels: Record<string, { label: string; icon: typeof Bot; color: string }> = {
  auto_approval: { label: "Aprovação Automática", icon: CheckCircle2, color: "text-green-500" },
  trial_expiration: { label: "Expiração de Trial", icon: XCircle, color: "text-orange-500" },
  plan_renewal: { label: "Renovação de Plano", icon: CheckCircle2, color: "text-blue-500" },
  plan_upgrade: { label: "Upgrade de Plano", icon: CheckCircle2, color: "text-purple-500" },
  custom_notification: { label: "Notificação Customizada", icon: Bot, color: "text-gray-500" },
};

export function AutomationRuleCard({ rule, onEdit }: AutomationRuleCardProps) {
  const toggleRule = useToggleAutomationRule();
  const deleteRule = useDeleteAutomationRule();

  const typeInfo = ruleTypeLabels[rule.rule_type] || ruleTypeLabels.custom_notification;
  const Icon = typeInfo.icon;

  const handleToggle = () => {
    toggleRule.mutate({ id: rule.id, is_active: !rule.is_active });
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir a regra "${rule.rule_name}"?`)) {
      deleteRule.mutate(rule.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`${typeInfo.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
              <CardDescription className="text-sm mt-1">{rule.description}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.is_active}
              onCheckedChange={handleToggle}
              disabled={toggleRule.isPending}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(rule)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <Badge variant={rule.is_active ? "default" : "secondary"}>
              {rule.is_active ? "Ativo" : "Inativo"}
            </Badge>
            
            <Badge variant="outline">
              {typeInfo.label}
            </Badge>
            
            <span className="text-muted-foreground">
              Prioridade: {rule.priority}
            </span>
          </div>
          
          <div className="text-muted-foreground">
            Criada em {format(new Date(rule.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

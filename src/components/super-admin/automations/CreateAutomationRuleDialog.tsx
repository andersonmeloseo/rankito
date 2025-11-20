import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateAutomationRule, useUpdateAutomationRule, AutomationRule } from "@/hooks/useAutomationRules";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface CreateAutomationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: AutomationRule | null;
}

export function CreateAutomationRuleDialog({ open, onOpenChange, editingRule }: CreateAutomationRuleDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    rule_name: editingRule?.rule_name || "",
    description: editingRule?.description || "",
    rule_type: editingRule?.rule_type || "auto_approval",
    priority: editingRule?.priority || 50,
    is_active: editingRule?.is_active ?? false,
    conditions: editingRule?.conditions || {},
    actions: editingRule?.actions || {},
    config: editingRule?.config || {},
  });

  const createRule = useCreateAutomationRule();
  const updateRule = useUpdateAutomationRule();

  const handleSubmit = async () => {
    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, ...formData });
    } else {
      await createRule.mutateAsync(formData);
    }
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      rule_name: "",
      description: "",
      rule_type: "auto_approval",
      priority: 50,
      is_active: false,
      conditions: {},
      actions: {},
      config: {},
    });
  };

  const updateCondition = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: { ...prev.conditions, [key]: value }
    }));
  };

  const updateAction = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: { ...prev.actions, [key]: value }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Editar Regra de Automação" : "Criar Nova Regra de Automação"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Configure o tipo e informações básicas da regra"}
            {step === 2 && "Defina as condições que acionam esta automação"}
            {step === 3 && "Configure as ações que serão executadas"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Básico */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rule_name">Nome da Regra</Label>
              <Input
                id="rule_name"
                value={formData.rule_name}
                onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                placeholder="Ex: Aprovação Automática Empresas"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo desta automação"
              />
            </div>

            <div>
              <Label htmlFor="rule_type">Tipo de Automação</Label>
              <Select value={formData.rule_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, rule_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_approval">Aprovação Automática</SelectItem>
                  <SelectItem value="trial_expiration">Expiração de Trial</SelectItem>
                  <SelectItem value="plan_upgrade">Upgrade de Plano</SelectItem>
                  <SelectItem value="custom_notification">Notificação Customizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade (0-100)</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 50 }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Ativar Regra Imediatamente</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Condições */}
        {step === 2 && (
          <div className="space-y-4">
            {formData.rule_type === "auto_approval" && (
              <>
                <div>
                  <Label>Domínios de Email Permitidos (separados por vírgula)</Label>
                  <Input
                    placeholder="Ex: empresa.com, organization.com"
                    value={(formData.conditions.allowed_email_domains || []).join(", ")}
                    onChange={(e) => updateCondition("allowed_email_domains", e.target.value.split(",").map(d => d.trim()))}
                  />
                </div>
                
                <div>
                  <Label>Planos Permitidos (separados por vírgula)</Label>
                  <Input
                    placeholder="Ex: starter, professional"
                    value={(formData.conditions.allowed_plans || []).join(", ")}
                    onChange={(e) => updateCondition("allowed_plans", e.target.value.split(",").map(p => p.trim()))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Website Obrigatório</Label>
                  <Switch
                    checked={formData.conditions.require_website || false}
                    onCheckedChange={(checked) => updateCondition("require_website", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Empresa Obrigatória</Label>
                  <Switch
                    checked={formData.conditions.require_company || false}
                    onCheckedChange={(checked) => updateCondition("require_company", checked)}
                  />
                </div>
              </>
            )}

            {formData.rule_type === "trial_expiration" && (
              <>
                <div>
                  <Label>Dias Antes de Expirar para Notificar</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.conditions.days_before_expiration || 3}
                    onChange={(e) => updateCondition("days_before_expiration", parseInt(e.target.value))}
                  />
                </div>
              </>
            )}

            {formData.rule_type === "plan_upgrade" && (
              <>
                <div>
                  <Label>Percentual de Uso para Sugerir Upgrade (%)</Label>
                  <Input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.conditions.usage_threshold_percent || 80}
                    onChange={(e) => updateCondition("usage_threshold_percent", parseInt(e.target.value))}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Ações */}
        {step === 3 && (
          <div className="space-y-4">
            {formData.rule_type === "auto_approval" && (
              <>
                <div>
                  <Label>Plano a Atribuir</Label>
                  <Input
                    placeholder="Ex: starter"
                    value={formData.actions.assign_plan || ""}
                    onChange={(e) => updateAction("assign_plan", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Dias de Trial</Label>
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.actions.trial_days || 0}
                    onChange={(e) => updateAction("trial_days", parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Enviar Email de Boas-vindas</Label>
                  <Switch
                    checked={formData.actions.send_welcome_email || false}
                    onCheckedChange={(checked) => updateAction("send_welcome_email", checked)}
                  />
                </div>
              </>
            )}

            {formData.rule_type === "trial_expiration" && (
              <>
                <div className="flex items-center justify-between">
                  <Label>Enviar Aviso de Expiração</Label>
                  <Switch
                    checked={formData.actions.send_expiration_warning || false}
                    onCheckedChange={(checked) => updateAction("send_expiration_warning", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Bloquear Conta ao Expirar</Label>
                  <Switch
                    checked={formData.actions.block_on_expiration || false}
                    onCheckedChange={(checked) => updateAction("block_on_expiration", checked)}
                  />
                </div>

                <div>
                  <Label>Dias para Estender Trial (0 = não estender)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.actions.extend_trial_days || 0}
                    onChange={(e) => updateAction("extend_trial_days", parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Oferecer Desconto</Label>
                  <Switch
                    checked={formData.actions.offer_discount || false}
                    onCheckedChange={(checked) => updateAction("offer_discount", checked)}
                  />
                </div>

                {formData.actions.offer_discount && (
                  <div>
                    <Label>Percentual de Desconto (%)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="50"
                      value={formData.actions.discount_percentage || 20}
                      onChange={(e) => updateAction("discount_percentage", parseInt(e.target.value))}
                    />
                  </div>
                )}
              </>
            )}

            {formData.rule_type === "plan_upgrade" && (
              <>
                <div>
                  <Label>Plano Sugerido</Label>
                  <Input
                    placeholder="Ex: professional"
                    value={formData.actions.suggest_plan || ""}
                    onChange={(e) => updateAction("suggest_plan", e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createRule.isPending || updateRule.isPending}
                className="flex-1"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {editingRule ? "Salvar Alterações" : "Criar Regra"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

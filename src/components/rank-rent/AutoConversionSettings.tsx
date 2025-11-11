import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Zap, Phone, Mail, MessageCircle, AlertTriangle, Info } from "lucide-react";
import { useAutoConversionSettings } from "@/hooks/useAutoConversionSettings";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AutoConversionSettings = () => {
  const [userId, setUserId] = useState<string>();
  const [showExpertMode, setShowExpertMode] = useState(false);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const { settings, isLoading, updateSettings, isUpdating } = useAutoConversionSettings();
  const { stages } = usePipelineStages(userId || '');
  
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleToggle = (field: string, value: boolean) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  const handleScoreChange = (field: string, value: string) => {
    const score = parseInt(value) || 0;
    const updated = { ...localSettings, [field]: Math.min(100, Math.max(0, score)) };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  const handleStageChange = (value: string) => {
    const updated = { ...localSettings, default_stage: value };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Configurações de Auto-Conversão
        </CardTitle>
        <CardDescription>
          Configure quando e como leads devem ser criados automaticamente no CRM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert de Aviso */}
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">
            ⚠️ Auto-Conversão Desabilitada (Recomendado)
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Cliques em botões capturam apenas dados técnicos (localização, device) <strong>sem informações de contato</strong>.
            <br/><br/>
            <strong>✅ Recomendado:</strong> Use o <strong>Plugin Rankito LeadGen</strong> para capturar leads 
            com formulários completos (nome, email, telefone, etc.)
            <br/><br/>
            <strong>📊 Analytics:</strong> Todos os cliques continuam sendo rastreados e aparecem nos relatórios.
          </AlertDescription>
        </Alert>

        {/* Card Informativo */}
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <AlertTitle className="text-blue-800 dark:text-blue-400">
            Como Funciona?
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-2">
            <div>
              🔍 <strong>Tracking (sempre ativo):</strong> Registra todos os cliques e conversões para analytics
            </div>
            <div>
              🤖 <strong>Auto-Conversão (opcional):</strong> Cria leads automaticamente no CRM
            </div>
            <div>
              📝 <strong>Plugin Rankito LeadGen:</strong> Captura formulários com dados completos
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <strong>Quando Usar Auto-Conversão?</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>❌ <strong>Cliques:</strong> Gera leads sem contato (não recomendado)</li>
                <li>✅ <strong>Formulários:</strong> Captura dados completos (recomendado via plugin)</li>
                <li>⚠️ <strong>Manual:</strong> Você decide quando criar um lead baseado nos analytics</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Switch Principal */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Ativar Auto-Conversão</Label>
            <p className="text-sm text-muted-foreground">
              Criar leads automaticamente quando conversões forem detectadas
            </p>
          </div>
          <Switch
            checked={localSettings?.enabled}
            onCheckedChange={(value) => handleToggle('enabled', value)}
            disabled={isUpdating}
          />
        </div>

        {/* Modo Expert Toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="expertMode"
            checked={showExpertMode}
            onCheckedChange={(checked) => setShowExpertMode(checked as boolean)}
          />
          <Label
            htmlFor="expertMode"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Mostrar Configurações Avançadas (Modo Expert)
          </Label>
        </div>

        {/* Configurações Avançadas */}
        {localSettings?.enabled && showExpertMode && (
          <>
            {/* Event Types */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Tipos de Eventos</h3>
              
              {/* WhatsApp */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <Label className="font-medium">WhatsApp Click</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={localSettings?.whatsapp_score}
                        onChange={(e) => handleScoreChange('whatsapp_score', e.target.value)}
                        className="w-20 h-8"
                        disabled={!localSettings?.whatsapp_click_enabled || isUpdating}
                      />
                      <span className="text-xs text-muted-foreground">pontos</span>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings?.whatsapp_click_enabled}
                    onCheckedChange={(value) => handleToggle('whatsapp_click_enabled', value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <Label className="font-medium">Telefone Click</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={localSettings?.phone_score}
                        onChange={(e) => handleScoreChange('phone_score', e.target.value)}
                        className="w-20 h-8"
                        disabled={!localSettings?.phone_click_enabled || isUpdating}
                      />
                      <span className="text-xs text-muted-foreground">pontos</span>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings?.phone_click_enabled}
                    onCheckedChange={(value) => handleToggle('phone_click_enabled', value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Form */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <Label className="font-medium">Formulário Submit</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={localSettings?.form_score}
                        onChange={(e) => handleScoreChange('form_score', e.target.value)}
                        className="w-20 h-8"
                        disabled={!localSettings?.form_submit_enabled || isUpdating}
                      />
                      <span className="text-xs text-muted-foreground">pontos</span>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings?.form_submit_enabled}
                    onCheckedChange={(value) => handleToggle('form_submit_enabled', value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Mail className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <Label className="font-medium">Email Click</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={localSettings?.email_score}
                        onChange={(e) => handleScoreChange('email_score', e.target.value)}
                        className="w-20 h-8"
                        disabled={!localSettings?.email_click_enabled || isUpdating}
                      />
                      <span className="text-xs text-muted-foreground">pontos</span>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings?.email_click_enabled}
                    onCheckedChange={(value) => handleToggle('email_click_enabled', value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            {/* Default Stage */}
            <div className="space-y-2">
              <Label>Estágio Padrão</Label>
              <Select
                value={localSettings?.default_stage}
                onValueChange={handleStageChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map((stage) => (
                    <SelectItem key={stage.stage_key} value={stage.stage_key}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Novos leads serão criados neste estágio do pipeline
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Como funciona:</strong> O sistema verifica automaticamente a cada 5 minutos se há novas conversões. 
                Conversões com pontuação ≥80 são marcadas como 🔥 HOT, entre 60-79 como ⚡ WARM, e abaixo de 60 como ❄️ COLD.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

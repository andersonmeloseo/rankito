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
        {/* Alert de Desabilitado */}
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
          <AlertTitle className="text-orange-800 dark:text-orange-400">
            🚫 Auto-Conversão Desabilitada
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <strong>Cliques NÃO criam leads automaticamente.</strong> O sistema rastreia todos os eventos para analytics, mas você deve criar leads manualmente quando julgar apropriado.
            <br/><br/>
            <strong>✅ Recomendado:</strong> Use o <strong>Plugin Rankito LeadGen</strong> para capturar formulários com dados completos de contato (nome, email, telefone, mensagem). Esses leads SIM são criados automaticamente no CRM.
            <br/><br/>
            <strong>📊 Analytics:</strong> Todos os cliques e conversões continuam sendo rastreados normalmente nos relatórios.
          </AlertDescription>
        </Alert>

        {/* Card Informativo */}
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <AlertTitle className="text-blue-800 dark:text-blue-400">
            Como Funciona Agora?
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-2">
            <div>
              🔍 <strong>Tracking (sempre ativo):</strong> Registra todos os cliques e conversões para analytics
            </div>
            <div>
              ❌ <strong>Cliques Simples:</strong> NÃO criam leads automaticamente (desabilitado)
            </div>
            <div>
              ✅ <strong>Plugin Rankito LeadGen:</strong> Formulários completos CRIAM leads automaticamente
            </div>
            <div>
              ✋ <strong>Criação Manual:</strong> Você decide quando criar leads baseado nos analytics
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <strong>Fluxo Recomendado:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>📊 Monitore analytics de cliques e conversões</li>
                <li>🎯 Identifique oportunidades qualificadas</li>
                <li>✍️ Crie leads manualmente no CRM quando apropriado</li>
                <li>🚀 Ou use o Plugin Rankito LeadGen para captura automática com dados completos</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Switch Principal - DESABILITADO */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 opacity-60">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold text-muted-foreground">Auto-Conversão de Cliques</Label>
            <p className="text-sm text-muted-foreground">
              Funcionalidade desabilitada permanentemente. Cliques não criam leads.
            </p>
          </div>
          <Switch
            checked={false}
            disabled={true}
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

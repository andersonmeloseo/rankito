import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, XCircle, Info, Loader2, Search, ExternalLink, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GSCPropertySelectorDialog } from "./GSCPropertySelectorDialog";

interface EditGSCIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: {
    id: string;
    site_id: string;
    connection_name: string;
    service_account_json: any;
    google_email?: string;
    gsc_property_url?: string | null;
  };
  onUpdate: (data: { 
    integrationId: string; 
    connectionName: string; 
    serviceAccountJson: any;
    gscPropertyUrl?: string | null;
  }) => void;
  isLoading?: boolean;
}

interface ValidationResult {
  status: 'idle' | 'testing' | 'success' | 'warning' | 'error';
  message?: string;
  details?: any;
}

export function EditGSCIntegrationDialog({
  open,
  onOpenChange,
  integration,
  onUpdate,
  isLoading = false,
}: EditGSCIntegrationDialogProps) {
  const [connectionName, setConnectionName] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [gscPropertyUrl, setGscPropertyUrl] = useState("");
  const [jsonValidation, setJsonValidation] = useState<{
    valid: boolean;
    error?: string;
    clientEmail?: string;
  }>({ valid: false });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<ValidationResult>({ status: 'idle' });
  const [propertySelectorOpen, setPropertySelectorOpen] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);

  // Preencher campos com dados atuais da integração
  useEffect(() => {
    if (open && integration) {
      setConnectionName(integration.connection_name);
      setGscPropertyUrl(integration.gsc_property_url || "");
      const jsonString = JSON.stringify(integration.service_account_json, null, 2);
      setJsonInput(jsonString);
      validateJSON(jsonString);
      setConnectionTestResult({ status: 'idle' });
    }
  }, [open, integration]);

  const validateJSON = (input: string) => {
    if (!input.trim()) {
      setJsonValidation({ valid: false });
      return;
    }

    try {
      const parsed = JSON.parse(input);
      
      if (parsed.type !== "service_account") {
        setJsonValidation({
          valid: false,
          error: 'O campo "type" deve ser "service_account"',
        });
        return;
      }

      const requiredFields = [
        "project_id",
        "private_key_id",
        "private_key",
        "client_email",
        "client_id",
        "auth_uri",
        "token_uri",
      ];

      for (const field of requiredFields) {
        if (!parsed[field]) {
          setJsonValidation({
            valid: false,
            error: `Campo obrigatório ausente: ${field}`,
          });
          return;
        }
      }

      setJsonValidation({
        valid: true,
        clientEmail: parsed.client_email,
      });
    } catch (err) {
      setJsonValidation({
        valid: false,
        error: "JSON inválido. Verifique a formatação.",
      });
    }
  };

  const handleJSONChange = (value: string) => {
    setJsonInput(value);
    validateJSON(value);
  };

  const handleTestConnection = async () => {
    if (!jsonValidation.valid) {
      toast.error('Corrija o JSON antes de testar a conexão');
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult({ status: 'testing' });

    try {
      // Criar integração temporária para teste
      const parsedJson = JSON.parse(jsonInput);
      const { data: tempIntegration, error: createError } = await supabase
        .from('google_search_console_integrations')
        .insert({
          site_id: integration.site_id, // ID do site (não da integração!)
          user_id: (await supabase.auth.getUser()).data.user?.id,
          connection_name: '__temp_test_connection__',
          service_account_json: parsedJson,
          google_email: parsedJson.client_email,
          is_active: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Chamar edge function de validação
      const { data, error } = await supabase.functions.invoke('gsc-validate-apis', {
        body: { integration_id: tempIntegration.id }
      });

      // Deletar integração temporária
      await supabase
        .from('google_search_console_integrations')
        .delete()
        .eq('id', tempIntegration.id);

      if (error) throw error;

      const { validation } = data;

      // Armazenar propriedades disponíveis
      if (validation.property_detection?.available_properties) {
        setAvailableProperties(validation.property_detection.available_properties);
        
        // Auto-sugerir URL se detectada
        if (validation.property_detection.suggested_url && !gscPropertyUrl) {
          setGscPropertyUrl(validation.property_detection.suggested_url);
        }
      }

      if (validation.overall_status === 'healthy') {
        setConnectionTestResult({
          status: 'success',
          message: '✅ Conexão validada com sucesso! Todas as APIs estão funcionando.',
          details: validation
        });
      } else if (validation.overall_status === 'degraded') {
        setConnectionTestResult({
          status: 'warning',
          message: '⚠️ Conexão parcial. Algumas APIs não estão disponíveis.',
          details: validation
        });
      } else {
        setConnectionTestResult({
          status: 'error',
          message: '❌ Falha na conexão. Verifique as permissões.',
          details: validation
        });
      }

    } catch (err: any) {
      setConnectionTestResult({
        status: 'error',
        message: `❌ Erro ao testar: ${err.message || 'Erro desconhecido'}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectionName.trim()) {
      return;
    }

    if (!jsonValidation.valid) {
      return;
    }

    const parsedJson = JSON.parse(jsonInput);
    onUpdate({
      integrationId: integration.id,
      connectionName: connectionName.trim(),
      serviceAccountJson: parsedJson,
      gscPropertyUrl: gscPropertyUrl || null,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleDetectProperties = () => {
    if (availableProperties.length > 0) {
      setPropertySelectorOpen(true);
    } else {
      toast.error('Teste a conexão primeiro para detectar propriedades disponíveis');
    }
  };

  const handlePropertySelect = (url: string) => {
    setGscPropertyUrl(url);
    toast.success('Propriedade selecionada com sucesso');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Integração Google Search Console</DialogTitle>
          <DialogDescription>
            Atualize o nome da conexão ou a Service Account do Google Cloud
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="connection-name">
              Nome da Conexão <span className="text-destructive">*</span>
            </Label>
            <Input
              id="connection-name"
              placeholder="Ex: Conta Principal, Backup, etc."
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              required
            />
          </div>

          {/* Service Account JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="service-account-json">
                Service Account JSON <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={!jsonValidation.valid || isTestingConnection}
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    🧪 Testar Conexão
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="service-account-json"
              placeholder='Cole aqui o JSON completo da Service Account...'
              value={jsonInput}
              onChange={(e) => handleJSONChange(e.target.value)}
              className="font-mono text-sm min-h-[200px]"
              required
            />
            
            {/* JSON Validation Feedback */}
            {jsonInput && (
              <div className="flex items-center gap-2 text-sm">
                {jsonValidation.valid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">
                      JSON válido - {jsonValidation.clientEmail}
                    </span>
                  </>
                ) : jsonValidation.error ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{jsonValidation.error}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Connection Test Result */}
          {connectionTestResult.status !== 'idle' && (
            <Alert 
              variant={
                connectionTestResult.status === 'success' ? 'default' :
                connectionTestResult.status === 'warning' ? 'default' :
                'destructive'
              }
              className={
                connectionTestResult.status === 'success' ? 'border-green-600 bg-green-50 dark:bg-green-950' :
                connectionTestResult.status === 'warning' ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950' :
                ''
              }
            >
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{connectionTestResult.message}</p>
                  
                  {connectionTestResult.details && (
                    <Collapsible>
                      <CollapsibleTrigger className="text-sm underline hover:no-underline">
                        Ver detalhes técnicos
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 space-y-1 text-sm border-t pt-2">
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Search Console API:</span>
                            {connectionTestResult.details.search_console_api?.active ? 
                              <span className="text-green-600">✅ Ativa</span> : 
                              <span className="text-destructive">❌ {connectionTestResult.details.search_console_api?.error || 'Inativa'}</span>
                            }
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Web Search Indexing API:</span>
                            {connectionTestResult.details.indexing_api?.active ? 
                              <span className="text-green-600">✅ Ativa</span> : 
                              <span className="text-destructive">❌ {connectionTestResult.details.indexing_api?.error || 'Inativa'}</span>
                            }
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Permissões GSC:</span>
                            {connectionTestResult.details.gsc_permissions?.valid ? 
                              <span className="text-green-600">✅ {connectionTestResult.details.gsc_permissions.level}</span> : 
                              <span className="text-destructive">❌ {connectionTestResult.details.gsc_permissions?.error || 'Sem permissão'}</span>
                            }
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Property URL Configuration */}
          {connectionTestResult.status !== 'idle' && (
            <div className="space-y-4">
              {/* Property URL Mismatch Alert */}
              {connectionTestResult.details?.property_detection?.url_matches === false && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <p className="font-semibold mb-2">⚠️ URL Incompatível Detectada</p>
                    <div className="text-sm space-y-1">
                      {connectionTestResult.details.property_detection.configured_url && (
                        <p>
                          <strong>URL Configurada:</strong>{' '}
                          <code className="bg-background/50 px-1 py-0.5 rounded">
                            {connectionTestResult.details.property_detection.configured_url}
                          </code>
                        </p>
                      )}
                      {connectionTestResult.details.property_detection.suggested_url && (
                        <p>
                          <strong>URL Sugerida:</strong>{' '}
                          <code className="bg-background/50 px-1 py-0.5 rounded">
                            {connectionTestResult.details.property_detection.suggested_url}
                          </code>
                        </p>
                      )}
                      <p className="mt-2">
                        {connectionTestResult.details.property_detection.available_properties?.length > 0 ? (
                          <>
                            Encontramos {connectionTestResult.details.property_detection.available_properties.length} propriedade(s) disponível(eis).
                            Use o botão "Detectar Propriedades" abaixo para selecionar a correta.
                          </>
                        ) : (
                          'Nenhuma propriedade disponível. Adicione a Service Account como proprietário no GSC.'
                        )}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Manual Property URL Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gsc-property-url">
                    URL da Propriedade GSC
                    <Info className="inline h-3 w-3 ml-1 text-muted-foreground" />
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectProperties}
                    disabled={availableProperties.length === 0}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Detectar Propriedades
                  </Button>
                </div>
                <Input
                  id="gsc-property-url"
                  placeholder="https://exemplo.com.br ou https://www.exemplo.com.br/"
                  value={gscPropertyUrl}
                  onChange={(e) => setGscPropertyUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  URL exata cadastrada no Google Search Console (com/sem www, com/sem barra final).
                  Deixe vazio para usar a URL do site automaticamente.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!connectionName.trim() || !jsonValidation.valid || isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Property Selector Dialog */}
      <GSCPropertySelectorDialog
        open={propertySelectorOpen}
        onOpenChange={setPropertySelectorOpen}
        properties={availableProperties}
        currentUrl={gscPropertyUrl}
        onSelect={handlePropertySelect}
      />
    </Dialog>
  );
}

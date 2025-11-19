import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddGSCIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteUrl: string;
  onAdd: (data: { connectionName: string; serviceAccountJson: any; gscPropertyUrl?: string }) => void;
  isLoading?: boolean;
}

export function AddGSCIntegrationDialog({
  open,
  onOpenChange,
  siteId,
  siteUrl,
  onAdd,
  isLoading = false,
}: AddGSCIntegrationDialogProps) {
  const [connectionName, setConnectionName] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [jsonValidation, setJsonValidation] = useState<{ valid: boolean; error?: string; clientEmail?: string }>({ valid: false });
  const [testResult, setTestResult] = useState<any>({ status: 'idle' });

  const validateJSON = (input: string) => {
    if (!input.trim()) {
      setJsonValidation({ valid: false });
      return false;
    }

    try {
      const parsed = JSON.parse(input);
      
      if (parsed.type !== "service_account") {
        setJsonValidation({ valid: false, error: 'O campo "type" deve ser "service_account"' });
        return false;
      }

      const requiredFields = ["project_id", "private_key_id", "private_key", "client_email", "client_id", "auth_uri", "token_uri"];

      for (const field of requiredFields) {
        if (!parsed[field]) {
          setJsonValidation({ valid: false, error: `Campo obrigatório ausente: ${field}` });
          return false;
        }
      }

      setJsonValidation({ valid: true, clientEmail: parsed.client_email });
      return true;
    } catch (err) {
      setJsonValidation({ valid: false, error: "JSON inválido. Verifique a formatação." });
      return false;
    }
  };

  const handleJSONChange = (value: string) => {
    setJsonInput(value);
    const validation = validateJSON(value);
    setTestResult({ status: 'idle' });
    setSelectedProperty("");
    
    // Auto-testar após validação bem-sucedida usando o valor diretamente
    if (validation !== false) {
      setTimeout(() => handleTestAndDetect(value), 500);
    }
  };

  const handleTestAndDetect = async (jsonValue?: string) => {
    const jsonToUse = jsonValue || jsonInput;
    
    if (!jsonToUse || !jsonToUse.trim()) {
      return;
    }

    setTestResult({ status: 'testing' });

    try {
      const parsedJson = JSON.parse(jsonToUse);

      const { data, error } = await supabase.functions.invoke('gsc-test-and-detect', {
        body: { service_account_json: parsedJson, configured_property_url: null, site_url: siteUrl },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Falha no teste');

      const results = data.results;
      
      // Auto-seleção inteligente de propriedade
      if (results.property_detection?.suggested_url) {
        setSelectedProperty(results.property_detection.suggested_url);
      } else if (results.available_properties?.length === 1) {
        setSelectedProperty(results.available_properties[0]);
      } else if (results.available_properties?.length > 0) {
        // Se múltiplas propriedades, auto-seleciona a primeira
        setSelectedProperty(results.available_properties[0]);
      }

      setTestResult({
        status: results.overall_status,
        authentication: results.authentication,
        available_properties: results.available_properties || [],
        property_detection: results.property_detection,
        apis: results.apis,
        suggestions: results.suggestions || [],
      });

      if (results.overall_status === 'healthy') {
        toast.success('Conexão testada com sucesso!');
      } else if (results.overall_status === 'warning') {
        toast.warning('Conexão estabelecida com avisos');
      } else {
        toast.error('Problemas detectados na conexão');
      }
    } catch (error) {
      toast.error('Erro ao testar conexão');
      setTestResult({ status: 'error', suggestions: ['❌ Erro ao comunicar com o servidor'] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectionName.trim()) {
      toast.error('Nome da conexão é obrigatório');
      return;
    }

    if (!jsonValidation.valid) {
      toast.error('JSON da Service Account é inválido');
      return;
    }

    if (testResult.status !== 'success' && testResult.status !== 'warning' && testResult.status !== 'healthy') {
      toast.error('Teste a conexão antes de salvar');
      return;
    }

    if (!selectedProperty) {
      toast.error('Selecione uma propriedade GSC');
      return;
    }

    const parsedJson = JSON.parse(jsonInput);
    onAdd({ connectionName: connectionName.trim(), serviceAccountJson: parsedJson, gscPropertyUrl: selectedProperty });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Integração GSC</DialogTitle>
          <DialogDescription>Configure uma nova integração com Google Search Console usando Service Account</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="connectionName">Nome da Conexão</Label>
            <Input id="connectionName" value={connectionName} onChange={(e) => setConnectionName(e.target.value)} placeholder="Ex: Principal, Backup, etc." required />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="serviceAccountJson">Service Account JSON</Label>
              {jsonValidation.valid && <Badge variant="outline" className="text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />JSON válido</Badge>}
            </div>
            <Textarea id="serviceAccountJson" value={jsonInput} onChange={(e) => handleJSONChange(e.target.value)} placeholder='Cole o JSON completo da Service Account aqui...' className="font-mono text-xs min-h-[200px]" required />
            {jsonValidation.error && <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertDescription>{jsonValidation.error}</AlertDescription></Alert>}
            {jsonValidation.valid && jsonValidation.clientEmail && <Alert><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertDescription>Email: <code className="text-xs">{jsonValidation.clientEmail}</code></AlertDescription></Alert>}
          </div>

          {/* Status do teste */}
          {testResult.status === 'testing' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Testando conexão e detectando propriedades...</AlertDescription>
            </Alert>
          )}

          {/* Propriedade detectada */}
          {selectedProperty && testResult.status !== 'idle' && testResult.status !== 'testing' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Propriedade GSC detectada:</strong>
                <br />
                <code className="text-sm bg-muted px-2 py-1 rounded mt-1 inline-block">
                  {selectedProperty}
                </code>
                {testResult.property_detection?.suggested_url === selectedProperty && (
                  <Badge variant="outline" className="ml-2 text-green-600">Recomendada</Badge>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Apenas sugestões críticas */}
          {testResult.suggestions && testResult.suggestions.filter((s: string) => 
            s.includes('❌') || s.includes('⚠️')
          ).length > 0 && testResult.status !== 'testing' && (
            <Alert variant={testResult.status === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="space-y-1 text-sm">
                  {testResult.suggestions
                    .filter((s: string) => s.includes('❌') || s.includes('⚠️'))
                    .map((suggestion: string, idx: number) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Indicador de sucesso */}
          {testResult.status === 'healthy' && selectedProperty && (
            <Alert className="border-green-600 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Tudo pronto! Clique em "Adicionar Integração" para finalizar.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isLoading || !connectionName.trim() || !jsonValidation.valid || !selectedProperty || (testResult.status !== 'healthy' && testResult.status !== 'success' && testResult.status !== 'warning')} className="flex-1">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Adicionar Integração'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

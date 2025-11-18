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
      return;
    }

    try {
      const parsed = JSON.parse(input);
      
      if (parsed.type !== "service_account") {
        setJsonValidation({ valid: false, error: 'O campo "type" deve ser "service_account"' });
        return;
      }

      const requiredFields = ["project_id", "private_key_id", "private_key", "client_email", "client_id", "auth_uri", "token_uri"];

      for (const field of requiredFields) {
        if (!parsed[field]) {
          setJsonValidation({ valid: false, error: `Campo obrigatório ausente: ${field}` });
          return;
        }
      }

      setJsonValidation({ valid: true, clientEmail: parsed.client_email });
    } catch (err) {
      setJsonValidation({ valid: false, error: "JSON inválido. Verifique a formatação." });
    }
  };

  const handleJSONChange = (value: string) => {
    setJsonInput(value);
    validateJSON(value);
    setTestResult({ status: 'idle' });
    setSelectedProperty("");
  };

  const handleTestAndDetect = async () => {
    if (!jsonValidation.valid) {
      toast.error('Corrija o JSON antes de testar');
      return;
    }

    setTestResult({ status: 'testing' });

    try {
      const parsedJson = JSON.parse(jsonInput);

      const { data, error } = await supabase.functions.invoke('gsc-test-and-detect', {
        body: { service_account_json: parsedJson, configured_property_url: null, site_url: siteUrl },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Falha no teste');

      const results = data.results;
      
      if (results.property_detection?.suggested_url) {
        setSelectedProperty(results.property_detection.suggested_url);
      } else if (results.available_properties?.length === 1) {
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
      console.error('Test error:', error);
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

  const getStatusBadge = () => {
    if (testResult.status === 'idle') return null;
    if (testResult.status === 'testing') return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Testando...</Badge>;
    if (testResult.status === 'healthy' || testResult.status === 'success') return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Conexão OK</Badge>;
    if (testResult.status === 'warning') return <Badge variant="default" className="bg-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Avisos</Badge>;
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
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

          <Button type="button" onClick={handleTestAndDetect} disabled={!jsonValidation.valid || testResult.status === 'testing'} className="w-full" variant="outline">
            {testResult.status === 'testing' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testando Conexão...</> : <><Search className="mr-2 h-4 w-4" />Testar e Detectar Propriedades</>}
          </Button>

          {testResult.status !== 'idle' && testResult.status !== 'testing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm font-medium">Status da Conexão:</span>{getStatusBadge()}</div>

              {testResult.available_properties && testResult.available_properties.length > 0 && (
                <div className="space-y-3">
                  <Label>Propriedades GSC Disponíveis ({testResult.available_properties.length})</Label>
                  <RadioGroup value={selectedProperty} onValueChange={setSelectedProperty}>
                    {testResult.available_properties.map((property: string) => (
                      <div key={property} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={property} id={property} />
                        <Label htmlFor={property} className="flex-1 cursor-pointer">
                          <code className="text-sm">{property}</code>
                          {property === testResult.property_detection?.suggested_url && <Badge variant="outline" className="ml-2 text-green-600">Sugerida</Badge>}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {testResult.suggestions && testResult.suggestions.length > 0 && (
                <Alert variant={testResult.status === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription className="space-y-1">
                    {testResult.suggestions.map((suggestion: string, idx: number) => <div key={idx} className="text-sm">{suggestion}</div>)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
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

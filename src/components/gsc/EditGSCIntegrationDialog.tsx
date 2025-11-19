import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditGSCIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: any;
  siteUrl: string;
  onUpdate: (data: { connectionName: string; serviceAccountJson: any; gscPropertyUrl?: string }) => void;
  isLoading?: boolean;
}

export function EditGSCIntegrationDialog({ open, onOpenChange, integration, siteUrl, onUpdate, isLoading = false }: EditGSCIntegrationDialogProps) {
  const [connectionName, setConnectionName] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [jsonValidation, setJsonValidation] = useState<{ valid: boolean; error?: string; clientEmail?: string }>({ valid: false });
  const [testResult, setTestResult] = useState<any>({ status: 'idle' });

  useEffect(() => {
    if (open && integration) {
      setConnectionName(integration.connection_name || "");
      setSelectedProperty(integration.gsc_property_url || "");
      
      if (integration.service_account_json) {
        const jsonString = JSON.stringify(integration.service_account_json, null, 2);
        setJsonInput(jsonString);
        validateJSON(jsonString);
      }
    }
  }, [open, integration]);

  const validateJSON = (input: string) => {
    if (!input.trim()) { setJsonValidation({ valid: false }); return false; }
    try {
      const parsed = JSON.parse(input);
      if (parsed.type !== "service_account") { setJsonValidation({ valid: false, error: 'O campo "type" deve ser "service_account"' }); return false; }
      const requiredFields = ["project_id", "private_key_id", "private_key", "client_email", "client_id", "auth_uri", "token_uri"];
      for (const field of requiredFields) { if (!parsed[field]) { setJsonValidation({ valid: false, error: `Campo obrigatório ausente: ${field}` }); return false; } }
      setJsonValidation({ valid: true, clientEmail: parsed.client_email });
      return true;
    } catch (err) { setJsonValidation({ valid: false, error: "JSON inválido. Verifique a formatação." }); return false; }
  };

  const handleTestAndDetect = async () => {
    if (!jsonValidation.valid) { toast.error('Corrija o JSON antes de testar'); return; }
    setTestResult({ status: 'testing' });
    try {
      const { data, error } = await supabase.functions.invoke('gsc-test-and-detect', { body: { service_account_json: JSON.parse(jsonInput), configured_property_url: selectedProperty || null, site_url: siteUrl } });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Falha no teste');
      const results = data.results;
      
      // Auto-seleção inteligente
      if (results.property_detection?.suggested_url) {
        setSelectedProperty(results.property_detection.suggested_url);
      } else if (results.available_properties?.length === 1) {
        setSelectedProperty(results.available_properties[0]);
      } else if (results.available_properties?.length > 0 && !selectedProperty) {
        setSelectedProperty(results.available_properties[0]);
      }
      
      setTestResult({ status: results.overall_status, authentication: results.authentication, available_properties: results.available_properties || [], property_detection: results.property_detection, apis: results.apis, suggestions: results.suggestions || [] });
      if (results.overall_status === 'healthy') toast.success('Conexão testada com sucesso!');
      else if (results.overall_status === 'warning') toast.warning('Conexão estabelecida com avisos');
      else toast.error('Problemas detectados na conexão');
    } catch (error) { console.error('Test error:', error); toast.error('Erro ao testar conexão'); setTestResult({ status: 'error', suggestions: ['❌ Erro ao comunicar com o servidor'] }); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionName.trim()) { toast.error('Nome da conexão é obrigatório'); return; }
    if (!jsonValidation.valid) { toast.error('JSON da Service Account é inválido'); return; }
    onUpdate({ connectionName: connectionName.trim(), serviceAccountJson: JSON.parse(jsonInput), gscPropertyUrl: selectedProperty || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Integração GSC</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2"><Label>Nome da Conexão</Label><Input value={connectionName} onChange={(e) => setConnectionName(e.target.value)} required /></div>
          <div className="space-y-2">
            <Label>Service Account JSON</Label>
            <Textarea value={jsonInput} onChange={(e) => { setJsonInput(e.target.value); validateJSON(e.target.value); setTestResult({ status: 'idle' }); }} className="font-mono text-xs min-h-[200px]" required />
          </div>
          <Button type="button" onClick={handleTestAndDetect} disabled={!jsonValidation.valid || testResult.status === 'testing'} className="w-full" variant="outline">
            {testResult.status === 'testing' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testando...</> : <><Search className="mr-2 h-4 w-4" />Testar Conexão</>}
          </Button>
          {testResult.status !== 'idle' && testResult.status !== 'testing' && testResult.available_properties?.length > 0 && (
            <RadioGroup value={selectedProperty} onValueChange={setSelectedProperty}>
              {testResult.available_properties.map((p: string) => <div key={p} className="flex items-center space-x-2 border rounded p-2"><RadioGroupItem value={p} id={p} /><Label htmlFor={p} className="flex-1"><code className="text-sm">{p}</code></Label></div>)}
            </RadioGroup>
          )}
          <div className="flex gap-3"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancelar</Button><Button type="submit" disabled={isLoading} className="flex-1">Salvar</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

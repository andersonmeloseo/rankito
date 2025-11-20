import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, TestTube, CheckCircle2, XCircle } from "lucide-react";
import { useGeolocationApis, GeolocationApi } from "@/hooks/useGeolocationApis";

interface AddEditGeolocationApiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api: GeolocationApi | null;
}

const PROVIDER_LABELS = {
  ipgeolocation: 'IPGeolocation.io',
  ipapi: 'IP-API',
  ipstack: 'IPStack',
  ipinfo: 'IPInfo.io',
};

export const AddEditGeolocationApiDialog = ({ open, onOpenChange, api }: AddEditGeolocationApiDialogProps) => {
  const { createApi, updateApi, testApi } = useGeolocationApis();
  
  const [formData, setFormData] = useState({
    provider_name: 'ipgeolocation' as GeolocationApi['provider_name'],
    api_key: '',
    display_name: '',
    priority: 1,
    monthly_limit: null as number | null,
    is_active: true,
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  useEffect(() => {
    if (api) {
      setFormData({
        provider_name: api.provider_name,
        api_key: api.api_key,
        display_name: api.display_name,
        priority: api.priority,
        monthly_limit: api.monthly_limit,
        is_active: api.is_active,
      });
    } else {
      setFormData({
        provider_name: 'ipgeolocation',
        api_key: '',
        display_name: '',
        priority: 1,
        monthly_limit: null,
        is_active: true,
      });
    }
    setTestResult(null);
  }, [api, open]);
  
  const handleTest = async () => {
    if (!formData.api_key && formData.provider_name !== 'ipapi') {
      setTestResult({ success: false, message: 'API Key é obrigatória' });
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    
    testApi(
      { provider: formData.provider_name, apiKey: formData.api_key || 'free' },
      {
        onSuccess: (data) => {
          setTestResult(data);
          setTesting(false);
        },
        onError: () => {
          setTestResult({ success: false, message: 'Erro ao testar API' });
          setTesting(false);
        }
      }
    );
  };
  
  const handleSubmit = () => {
    if (!formData.display_name || (!formData.api_key && formData.provider_name !== 'ipapi')) {
      return;
    }
    
    if (api) {
      updateApi({ id: api.id, updates: formData });
    } else {
      createApi(formData);
    }
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{api ? 'Editar API' : 'Adicionar Nova API'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select 
              value={formData.provider_name} 
              onValueChange={(value: GeolocationApi['provider_name']) => setFormData({ ...formData, provider_name: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="display_name">Nome de Identificação</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Ex: IPGeo - Key 01"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api_key">
              API Key {formData.provider_name === 'ipapi' && '(Opcional para IP-API)'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="Cole sua API key aqui"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            </div>
            {testResult && (
              <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {testResult.message}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade (1-100)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthly_limit">Limite Mensal (opcional)</Label>
              <Input
                id="monthly_limit"
                type="number"
                value={formData.monthly_limit || ''}
                onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Ex: 30000"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">API Ativa</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.display_name || (!formData.api_key && formData.provider_name !== 'ipapi')}>
            {api ? 'Salvar Alterações' : 'Adicionar API'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

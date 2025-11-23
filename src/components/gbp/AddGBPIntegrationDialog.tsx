import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ExternalLink, Info, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddGBPIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteUrl: string;
  onSuccess: () => void;
}

export function AddGBPIntegrationDialog({
  open,
  onOpenChange,
  siteId,
  siteUrl,
  onSuccess,
}: AddGBPIntegrationDialogProps) {
  const [step, setStep] = useState<'tutorial' | 'config' | 'success'>('tutorial');
  const [connectionName, setConnectionName] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [jsonValid, setJsonValid] = useState(false);
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const tutorialSteps = [
    { text: "Acesse o Google Cloud Console", link: "https://console.cloud.google.com" },
    { text: "Crie um projeto ou selecione um existente" },
    { 
      text: "Ative as 3 APIs necessárias (clique em cada link abaixo):",
      subSteps: [
        { 
          text: "My Business Account Management API", 
          link: "https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com"
        },
        { 
          text: "My Business Business Information API (obrigatória)", 
          link: "https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com"
        },
        { 
          text: "Business Profile Performance API (obrigatória para analytics)", 
          link: "https://console.cloud.google.com/apis/library/businessprofileperformance.googleapis.com"
        }
      ]
    },
    { text: "Crie uma Service Account: IAM & Admin > Service Accounts > Create" },
    { text: "Baixe o arquivo JSON da Service Account (Create Key > JSON)" },
    { text: "Copie o client_email do JSON" },
    { text: "No Google Business Profile, adicione o client_email como Manager" },
  ];

  const validateJSON = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      
      if (parsed.type !== 'service_account') {
        toast.error('JSON inválido: tipo deve ser "service_account"');
        setJsonValid(false);
        return;
      }

      const requiredFields = ['project_id', 'private_key', 'client_email'];
      const missing = requiredFields.filter(field => !parsed[field]);
      
      if (missing.length > 0) {
        toast.error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
        setJsonValid(false);
        return;
      }

      setParsedJson(parsed);
      setJsonValid(true);
      toast.success(`JSON válido! Email: ${parsed.client_email}`);
      
      // Auto-test after validation
      testConnection(parsed);
      
    } catch (error) {
      toast.error('JSON inválido: formato incorreto');
      setJsonValid(false);
    }
  };

  const testConnection = async (json: any) => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gbp-validate-service-account', {
        body: { service_account_json: json },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setLocations(data.locations || []);
      
      if (data.locations && data.locations.length > 0) {
        setSelectedLocation(data.locations[0].name);
        toast.success(`${data.locations.length} localização(ões) detectada(s)!`);
      } else {
        toast.warning('Nenhuma localização encontrada');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(error.message || 'Falha no teste de conexão');
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreate = async () => {
    if (!connectionName || !jsonValid || !parsedJson) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('google_business_profiles')
        .insert({
          user_id: parsedJson.client_email,
          site_id: siteId,
          connection_name: connectionName,
          service_account_json: parsedJson,
          google_email: parsedJson.client_email,
          location_name: selectedLocation || null,
          is_active: true,
          health_status: 'healthy',
        });

      if (error) throw error;

      setStep('success');
      toast.success('Perfil GBP conectado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Create error:', error);
      toast.error(error.message || 'Erro ao criar perfil GBP');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep('tutorial');
    setConnectionName('');
    setServiceAccountJson('');
    setJsonValid(false);
    setParsedJson(null);
    setLocations([]);
    setSelectedLocation('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'tutorial' && 'Como Conectar Google Business Profile'}
            {step === 'config' && 'Configurar Perfil GBP'}
            {step === 'success' && 'Perfil Conectado!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'tutorial' && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Você vai precisar criar uma Service Account no Google Cloud Console.
                Siga os passos abaixo:
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {tutorialSteps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{step.text}</p>
                        {step.subSteps && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                              3 APIs
                            </span>
                          </div>
                        )}
                      </div>
                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Abrir link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {step.subSteps && (
                    <div className="ml-12 space-y-2">
                      {step.subSteps.map((subStep: any, subIndex: number) => (
                        <div key={subIndex} className="flex items-start gap-2 p-2 border-l-2 border-primary/20 pl-3">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium">{subStep.text}</p>
                            {subStep.link && (
                              <a
                                href={subStep.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                              >
                                Ativar API <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={() => setStep('config')} className="w-full">
              Continuar para Configuração
            </Button>
          </div>
        )}

        {step === 'config' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connection-name">Nome da Conexão *</Label>
              <Input
                id="connection-name"
                placeholder="Ex: Meu Negócio Principal"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-account-json">Service Account JSON *</Label>
              <Textarea
                id="service-account-json"
                placeholder='Cole aqui o conteúdo completo do arquivo JSON...'
                value={serviceAccountJson}
                onChange={(e) => {
                  setServiceAccountJson(e.target.value);
                  if (e.target.value) {
                    validateJSON(e.target.value);
                  }
                }}
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            {jsonValid && parsedJson && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">JSON válido!</p>
                    <p className="text-xs">Email: {parsedJson.client_email}</p>
                    <p className="text-xs">Project: {parsedJson.project_id}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isTesting && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Testando conexão...</AlertDescription>
              </Alert>
            )}

            {locations.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <p className="font-medium mb-2">
                    {locations.length} localização(ões) detectada(s)
                  </p>
                  {locations.map((loc: any) => (
                    <div key={loc.name} className="text-xs p-2 bg-muted rounded">
                      <p className="font-medium">{loc.title}</p>
                      {loc.address && (
                        <p className="text-muted-foreground">
                          {loc.address.addressLines?.join(', ')} - {loc.address.locality}
                        </p>
                      )}
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('tutorial')} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!jsonValid || !connectionName || isCreating}
                className="flex-1"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Finalizar Configuração
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center py-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Perfil GBP Conectado!</h3>
              <p className="text-sm text-muted-foreground">
                Seu perfil do Google Business Profile foi conectado com sucesso.
              </p>
              
              {locations.length > 0 && (
                <div className="text-left p-4 bg-muted rounded-lg mt-4">
                  <p className="text-sm font-medium mb-2">Informações do Negócio:</p>
                  <p className="text-sm">{locations[0].title}</p>
                  {locations[0].address && (
                    <p className="text-xs text-muted-foreground">
                      {locations[0].address.addressLines?.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

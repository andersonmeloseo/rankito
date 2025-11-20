import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Loader2, BookOpen, Cloud, Key, Settings, UserPlus, FileJson, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionName, setConnectionName] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [jsonValidation, setJsonValidation] = useState<{ valid: boolean; error?: string; clientEmail?: string }>({ valid: false });
  const [testResult, setTestResult] = useState<any>({ status: 'idle' });
  const [isSuccess, setIsSuccess] = useState(false);

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
    setIsSuccess(true);
    setCurrentStep(3);
  };

  const tutorialSteps = [
    {
      number: 1,
      title: "Acesse o Google Cloud Console",
      description: "Faça login com sua conta Google",
      link: "https://console.cloud.google.com/"
    },
    {
      number: 2,
      title: "Crie um novo projeto",
      description: "Dê o nome de 'Rankito CRM'. Não precisa escolher nada em Local, clique em Criar",
      link: "https://console.cloud.google.com/projectcreate"
    },
    {
      number: 3,
      title: "Ative a API do Google Search Console",
      description: "Clique no botão 'Ativar' para habilitar a API",
      link: "https://console.cloud.google.com/marketplace/product/google/searchconsole.googleapis.com"
    },
    {
      number: 4,
      title: "Ative a Web Search Indexing API",
      description: "Clique no botão 'Ativar' para habilitar a API de indexação",
      link: "https://console.cloud.google.com/marketplace/product/google/indexing.googleapis.com"
    },
    {
      number: 5,
      title: "Acesse IAM e Admin > Contas de Serviço",
      description: "Clique em '+ Criar Conta de Serviço'",
      link: "https://console.cloud.google.com/iam-admin/serviceaccounts"
    },
    {
      number: 6,
      title: "Criar conta de serviço",
      description: "Dê o nome 'Rankito CRM', clique em 'Criar e Continuar'. Nas permissões não precisa colocar nada, clique em 'Concluído'",
      link: null
    },
    {
      number: 7,
      title: "Gerenciar chaves",
      description: "Na lista de contas de serviço, clique nos 3 pontinhos no final da linha e selecione 'Gerenciar Chaves'",
      link: null
    },
    {
      number: 8,
      title: "Gerar chave JSON",
      description: "Clique em 'Adicionar Chave' > 'Criar nova chave' > selecione 'JSON'. Salve o arquivo baixado em local seguro",
      link: null
    },
    {
      number: 9,
      title: "Copiar email da Service Account",
      description: "Volte em 'Contas de Serviço', passe o mouse sobre o email e clique no ícone de copiar. Cole em um arquivo para consultar depois",
      link: null
    },
    {
      number: 10,
      title: "Acessar Google Search Console",
      description: "Abra o Search Console, clique no menu (3 linhas), selecione o projeto, vá em 'Configurações' (final do menu lateral) > 'Usuários e Permissões'",
      link: "https://search.google.com/search-console/about"
    },
    {
      number: 11,
      title: "Adicionar Service Account como Proprietário",
      description: "Clique em 'Adicionar Usuário', cole o email da Service Account copiado anteriormente, selecione permissão 'Proprietário' e clique em 'Adicionar'",
      link: null
    }
  ];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Integração GSC</DialogTitle>
          <DialogDescription>
            {currentStep === 1 && "Siga o tutorial passo a passo para obter as credenciais"}
            {currentStep === 2 && "Configure a integração no sistema"}
            {currentStep === 3 && "Integração configurada com sucesso!"}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de Progresso */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                currentStep >= step 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-muted-foreground/30 text-muted-foreground'
              }`}>
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-blue-600' : 'bg-muted-foreground/30'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Etapa 1: Tutorial */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                Siga este tutorial passo a passo para criar e configurar sua Service Account no Google Cloud Console.
                Cada passo tem um link direto para facilitar a navegação.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {tutorialSteps.map((step) => (
                <Card key={step.number} className="border-l-4 border-l-blue-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="shrink-0">
                        {step.number}
                      </Badge>
                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-base">{step.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {step.description}
                        </CardDescription>
                        {step.link && (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-blue-600"
                            onClick={() => window.open(step.link, '_blank')}
                          >
                            Abrir no Google Cloud <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Alert className="bg-yellow-50 border-yellow-600">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Importante:</strong> Salve o arquivo JSON gerado no passo 8 e o email da Service Account do passo 9. 
                Você precisará deles na próxima etapa.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)}>
                Próximo: Configurar no Sistema <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 2: Configuração */}
        {currentStep === 2 && (
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

            {/* Sugestões críticas */}
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
                  ✅ Tudo pronto! Clique em "Finalizar Configuração" para concluir.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} disabled={isLoading}>
                Voltar ao Tutorial
              </Button>
              <Button type="submit" disabled={isLoading || !connectionName.trim() || !jsonValidation.valid || !selectedProperty || (testResult.status !== 'healthy' && testResult.status !== 'success' && testResult.status !== 'warning')} className="flex-1">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Finalizar Configuração'}
              </Button>
            </div>
          </form>
        )}

        {/* Etapa 3: Sucesso */}
        {currentStep === 3 && isSuccess && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Integração GSC Configurada!</h3>
                <p className="text-muted-foreground">
                  Sua integração com Google Search Console foi configurada com sucesso
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo da Configuração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Nome da Conexão</p>
                    <p className="text-sm text-muted-foreground">{connectionName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UserPlus className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Service Account Email</p>
                    <p className="text-sm text-muted-foreground font-mono">{jsonValidation.clientEmail}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Cloud className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Propriedade GSC</p>
                    <p className="text-sm text-muted-foreground">{selectedProperty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                <strong>Próximos passos:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Adicione URLs à fila de indexação</li>
                  <li>• Configure indexação automática por sitemap</li>
                  <li>• Monitore o status de indexação no painel</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={() => {
                onOpenChange(false);
                setCurrentStep(1);
                setConnectionName("");
                setJsonInput("");
                setSelectedProperty("");
                setJsonValidation({ valid: false });
                setTestResult({ status: 'idle' });
                setIsSuccess(false);
              }}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

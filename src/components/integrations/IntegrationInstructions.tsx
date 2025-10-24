import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Webhook, ExternalLink, Globe, Code } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IntegrationInstructionsProps {
  source: any;
  open: boolean;
  onClose: () => void;
}

export const IntegrationInstructions = ({
  source,
  open,
  onClose,
}: IntegrationInstructionsProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const apiUrl = `${window.location.origin}/functions/v1/create-deal-from-external-source`;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const WebhookInstructions = () => (
    <div className="space-y-4">
      <Alert>
        <Webhook className="h-4 w-4" />
        <AlertDescription>
          Use este endpoint em seu chatbot (ManyChat, Chatfuel, etc.) ou plataforma de automação (Zapier, Make).
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. URL do Webhook</h4>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 text-xs bg-muted rounded-md overflow-x-auto">
                {apiUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiUrl, 'URL do Webhook')}
              >
                {copied === 'URL do Webhook' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Token de Autenticação</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Adicione este token no header <code className="text-xs">x-api-token</code>
            </p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 text-xs bg-muted rounded-md overflow-x-auto font-mono">
                {source.api_token}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(source.api_token, 'Token')}
              >
                {copied === 'Token' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Formato do Payload (JSON)</h4>
            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`{
  "name": "Nome do Lead",
  "phone": "(11) 99999-9999",
  "email": "email@exemplo.com",
  "message": "Mensagem do chatbot",
  "source_type": "webhook",
  "custom_fields": {
    "origem": "WhatsApp",
    "bot": "chatbot-vendas"
  }
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">4. Headers Necessários</h4>
            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`Content-Type: application/json
x-api-token: ${source.api_token}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-3">Exemplos de Uso:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span><strong>ManyChat/Chatfuel:</strong> Configure Ação → HTTP Request → POST → Cole URL e Token</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span><strong>Zapier:</strong> Trigger → Webhook → Catch Hook → Action → Webhooks → POST</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span><strong>Make (Integromat):</strong> HTTP → Make a request → Method: POST</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span><strong>WhatsApp Business API:</strong> Webhook de mensagens recebidas</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const WordPressInstructions = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Configure o Plugin</h4>
            <p className="text-sm text-muted-foreground mb-2">
              No WordPress, vá em <strong>Configurações → Rank & Rent CRM</strong> e cole:
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">URL da API:</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 text-xs bg-muted rounded-md overflow-x-auto">
                    {apiUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(apiUrl, 'URL da API')}
                  >
                    {copied === 'URL da API' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Token da API:</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 text-xs bg-muted rounded-md overflow-x-auto font-mono">
                    {source.api_token}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(source.api_token, 'Token')}
                  >
                    {copied === 'Token' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Teste a Integração</h4>
            <p className="text-sm text-muted-foreground">
              Após salvar, preencha um formulário no seu site. O lead deve aparecer no CRM automaticamente!
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-3">Recursos do Plugin:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span>Captura automática de formulários (CF7, Gravity, WPForms)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span>Intercepta botões de WhatsApp e telefone</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span>Score automático de leads</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span>Tracking de UTMs e origem</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const APIInstructions = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h4 className="font-medium mb-2">Endpoint da API</h4>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 text-xs bg-muted rounded-md overflow-x-auto">
                POST {apiUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(`POST ${apiUrl}`, 'Endpoint')}
              >
                {copied === 'Endpoint' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Headers</h4>
            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`Content-Type: application/json
x-api-token: ${source.api_token}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Body (JSON)</h4>
            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "message": "Gostaria de um orçamento",
  "company": "Empresa XYZ",
  "page_url": "https://site.com.br/contato",
  "source_type": "api",
  "custom_fields": {
    "interesse": "Serviço Premium"
  }
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Resposta de Sucesso</h4>
            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`{
  "success": true,
  "deal_id": "uuid-do-deal",
  "lead_score": 75,
  "lead_quality": "hot",
  "message": "Lead captured successfully"
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Campos Obrigatórios</h4>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <code className="text-xs">name</code> - Nome do lead (mín. 2 caracteres)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground text-xs mt-1">Opcional:</span>
                <span className="text-xs text-muted-foreground">
                  email, phone, message, company, page_url, custom_fields
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {source.source_type === 'wordpress' && <Globe className="w-5 h-5" />}
            {source.source_type === 'webhook' && <Webhook className="w-5 h-5" />}
            {source.source_type === 'api' && <Code className="w-5 h-5" />}
            Instruções de Configuração
          </DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para conectar sua integração ao CRM
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="instructions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Instruções</TabsTrigger>
            <TabsTrigger value="test">Testar</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="mt-4">
            {source.source_type === 'webhook' && <WebhookInstructions />}
            {source.source_type === 'wordpress' && <WordPressInstructions />}
            {source.source_type === 'api' && <APIInstructions />}
          </TabsContent>

          <TabsContent value="test" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h4 className="font-medium">Como testar sua integração:</h4>
                <ol className="space-y-3 text-sm list-decimal list-inside">
                  {source.source_type === 'webhook' && (
                    <>
                      <li>Configure o webhook em seu chatbot/plataforma</li>
                      <li>Envie uma mensagem de teste</li>
                      <li>Verifique se o lead aparece na aba CRM</li>
                    </>
                  )}
                  {source.source_type === 'wordpress' && (
                    <>
                      <li>Preencha um formulário no seu site WordPress</li>
                      <li>Ou clique em um botão de WhatsApp/telefone</li>
                      <li>Verifique se o lead aparece na aba CRM</li>
                    </>
                  )}
                  {source.source_type === 'api' && (
                    <>
                      <li>Faça uma requisição POST para a API</li>
                      <li>Verifique o código de resposta (200 = sucesso)</li>
                      <li>Confirme se o lead aparece na aba CRM</li>
                    </>
                  )}
                </ol>

                <Alert>
                  <AlertDescription>
                    💡 <strong>Dica:</strong> Os leads aparecem em tempo real. 
                    Se não aparecer, verifique o token e a URL da API.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

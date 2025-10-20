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
import { Copy, Check, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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

  const WordPressInstructions = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Baixe o Plugin</h4>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar rank-rent-crm-plugin.zip
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Faça upload no WordPress: Plugins → Adicionar Novo → Enviar
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Configure o Plugin</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Após ativar, vá em <strong>Configurações → Rank & Rent CRM</strong> e cole:
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
            <h4 className="font-medium mb-2">3. Teste a Integração</h4>
            <p className="text-sm text-muted-foreground">
              Após salvar as configurações, preencha um formulário no seu site para testar.
              O lead deve aparecer automaticamente no CRM!
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
              <span>Widget flutuante customizável</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span>Captura automática de formulários (CF7, Gravity, WPForms, etc)</span>
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

  const ChromeInstructions = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Instale a Extensão</h4>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar rank-rent-chrome-extension.zip
            </Button>
            <div className="mt-3 text-sm space-y-1">
              <p>Depois de baixar:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                <li>Extraia o arquivo ZIP</li>
                <li>Abra <code>chrome://extensions/</code> no Chrome</li>
                <li>Ative "Modo do desenvolvedor"</li>
                <li>Clique em "Carregar sem compactação"</li>
                <li>Selecione a pasta extraída</li>
              </ol>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Configure a Extensão</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Clique no ícone da extensão e cole:
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
                    onClick={() => copyToClipboard(apiUrl, 'URL')}
                  >
                    {copied === 'URL' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Token:</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 text-xs bg-muted rounded-md overflow-x-auto font-mono">
                    {source.api_token}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(source.api_token, 'Token')}
                  >
                    {copied === 'Token' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Use no WhatsApp Web</h4>
            <p className="text-sm text-muted-foreground">
              Abra o WhatsApp Web. Você verá um botão "+ CRM" ao lado de cada contato.
              Clique para adicionar o contato como lead no CRM instantaneamente!
            </p>
          </div>
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
  "page_title": "Contato",
  "form_name": "Formulário Principal",
  "source_type": "wordpress_form",
  "utm_source": "google",
  "utm_campaign": "campanha_verao",
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
                  email, phone, message, company, page_url, form_name, custom_fields
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" asChild>
        <a href="#" target="_blank">
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver Documentação Completa da API
        </a>
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Instruções de Instalação</DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para conectar {source.source_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="instructions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Instruções</TabsTrigger>
            <TabsTrigger value="testing">Como Testar</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="space-y-4">
            {source.source_type === 'wordpress' && <WordPressInstructions />}
            {source.source_type === 'chrome_extension' && <ChromeInstructions />}
            {source.source_type === 'api' && <APIInstructions />}
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Como Testar a Integração</h4>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="font-bold text-primary">1.</span>
                      <span>
                        Complete a configuração seguindo as instruções acima
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-primary">2.</span>
                      <span>
                        {source.source_type === 'wordpress' && 'Preencha um formulário no seu site'}
                        {source.source_type === 'chrome_extension' && 'Abra o WhatsApp Web e clique em "+ CRM"'}
                        {source.source_type === 'api' && 'Faça uma requisição POST para a API'}
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-primary">3.</span>
                      <span>
                        Volte para o CRM e verifique se o lead apareceu na pipeline (stage: Lead)
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-primary">4.</span>
                      <span>
                        Verifique se o badge de origem está correto e se os dados foram capturados
                      </span>
                    </li>
                  </ol>
                </div>

                <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
                  <p className="text-sm">
                    <strong>💡 Dica:</strong> Os leads capturados automaticamente terão um{' '}
                    <strong>score de qualidade</strong> (HOT, WARM, COLD) baseado na completude
                    dos dados fornecidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onClose}>
            Concluído
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

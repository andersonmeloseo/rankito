import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Download, Settings, Code, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PluginDocumentationDialogProps {
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const PluginDocumentationDialog = ({
  open,
  onClose,
  onDownload,
}: PluginDocumentationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Plugin WordPress: Rankito LeadGen
          </DialogTitle>
          <DialogDescription>
            Documentação completa de instalação e configuração
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="installation" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="installation">Instalação</TabsTrigger>
            <TabsTrigger value="configuration">Configuração</TabsTrigger>
            <TabsTrigger value="shortcodes">Shortcodes</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="installation" className="space-y-4 mt-4">
            <Alert>
              <Download className="w-4 h-4" />
              <AlertDescription>
                <strong>Passo 1:</strong> Baixe o plugin clicando no botão abaixo
              </AlertDescription>
            </Alert>

            <Button onClick={onDownload} size="lg" className="w-full gap-2">
              <Download className="w-5 h-5" />
              Baixar Plugin rankito-leadgen.zip
            </Button>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Passos de Instalação
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <strong>Acesse o WordPress Admin</strong>
                      <p className="text-muted-foreground">Vá em Plugins → Adicionar Novo → Enviar Plugin</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <strong>Faça Upload do arquivo .zip</strong>
                      <p className="text-muted-foreground">Selecione o arquivo rankito-leadgen.zip baixado</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <strong>Ative o Plugin</strong>
                      <p className="text-muted-foreground">Clique em "Instalar Agora" e depois em "Ativar Plugin"</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <strong>Configure o Plugin</strong>
                      <p className="text-muted-foreground">Aparecerá "Rankito LeadGen" no menu lateral do admin</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold mb-4">📋 Configuração Inicial</h3>
                
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">1️⃣ Integração RankiTO</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      No WordPress, acesse: <code className="bg-muted px-2 py-1 rounded">Rankito LeadGen → Aba "Integração RankiTO"</code>
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span><strong>URL da API:</strong> Cole a URL da sua integração criada</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span><strong>Token:</strong> Cole o Token da API (copiado da integração)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span><strong>Teste:</strong> Clique em "Testar Conexão" para validar</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">2️⃣ Configurar Botão/Link</h4>
                    <p className="text-sm text-muted-foreground">Escolha como exibir o formulário:</p>
                    <ul className="space-y-1 text-sm mt-2">
                      <li>• <strong>Botão Flutuante:</strong> Aparece fixo na tela (recomendado)</li>
                      <li>• <strong>Shortcode:</strong> Insira manualmente onde desejar</li>
                      <li>• <strong>Link de Texto:</strong> Transforme qualquer link em gatilho</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">3️⃣ Personalizar Campos</h4>
                    <p className="text-sm text-muted-foreground">Configure quais campos capturar:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>Nome (obrigatório)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>Email</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>Telefone</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>Empresa</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>Mensagem</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>Campos customizados</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">4️⃣ Visual do Modal</h4>
                    <p className="text-sm text-muted-foreground">Customize cores, tamanhos, título e mensagens</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>💡 Dica:</strong> Configure o "Estágio Padrão" em CRM → Auto-Conversão para definir onde os leads capturados aparecerão no funil
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="shortcodes" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Shortcode para Botão
                  </h3>
                  <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                    [rankito_button text="Fale Conosco"]
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Insira este shortcode em qualquer página, post ou widget
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Shortcode para Link
                  </h3>
                  <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                    [rankito_link text="Clique aqui para contato"]
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cria um link de texto que abre o modal ao clicar
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Exemplos de Uso:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary" />
                      <span>Em uma página: Adicione o shortcode no editor de blocos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary" />
                      <span>Em um widget: Use o bloco "Shortcode" na sidebar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary" />
                      <span>No tema: <code className="text-xs bg-muted px-1 py-0.5 rounded">{"<?php echo do_shortcode('[rankito_button]'); ?>"}</code></span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold mb-4">🔧 Problemas Comuns e Soluções</h3>

                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <h4 className="font-medium text-sm mb-1">❌ "Erro de configuração. Contate administrador"</h4>
                    <p className="text-xs text-muted-foreground">
                      <strong>Solução:</strong> Verifique se o Token da API está correto. Teste a conexão no painel admin.
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <h4 className="font-medium text-sm mb-1">❌ Modal não abre ao clicar no botão</h4>
                    <p className="text-xs text-muted-foreground">
                      <strong>Solução:</strong> Limpe o cache do WordPress e do navegador. Verifique se há conflitos com outros plugins.
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <h4 className="font-medium text-sm mb-1">❌ Leads não aparecem no CRM</h4>
                    <p className="text-xs text-muted-foreground">
                      <strong>Solução:</strong> Verifique se a URL da API está correta e se o Token está ativo na plataforma RankiTO.
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950">
                    <h4 className="font-medium text-sm mb-1">✅ Como ativar o modo debug?</h4>
                    <p className="text-xs text-muted-foreground">
                      Vá em "Configurações Avançadas" → Ative "Logs de Debug" → Abra o console do navegador (F12) para ver detalhes.
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    <strong>Ainda com problemas?</strong><br/>
                    Entre em contato: suporte@rankito.com
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface PluginInstallationGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PluginInstallationGuide({ open, onOpenChange }: PluginInstallationGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">📖 Guia de Instalação do Plugin</DialogTitle>
          <DialogDescription>
            Siga este passo a passo para instalar e configurar o plugin WordPress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="text-lg px-3">1</Badge>
              <h3 className="text-lg font-semibold">Preparar o Plugin</h3>
            </div>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Criar estrutura de arquivos:</p>
                <ol className="space-y-1 text-sm ml-4">
                  <li>1. Crie uma pasta chamada <code className="bg-muted px-1 rounded">rank-rent-tracker</code></li>
                  <li>2. Dentro dela, crie o arquivo <code className="bg-muted px-1 rounded">rank-rent-tracker.php</code></li>
                  <li>3. Crie uma pasta <code className="bg-muted px-1 rounded">assets</code> e adicione <code className="bg-muted px-1 rounded">admin.css</code></li>
                  <li>4. Adicione o arquivo <code className="bg-muted px-1 rounded">readme.txt</code></li>
                  <li>5. Copie o conteúdo do arquivo baixado para os arquivos correspondentes</li>
                  <li>6. Comprima a pasta <code className="bg-muted px-1 rounded">rank-rent-tracker</code> em um arquivo .zip</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="text-lg px-3">2</Badge>
              <h3 className="text-lg font-semibold">Instalar no WordPress</h3>
            </div>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <ol className="space-y-2 text-sm">
                  <li>1. No WordPress, vá em <strong>Plugins → Adicionar Novo</strong></li>
                  <li>2. Clique em <strong>"Enviar Plugin"</strong> no topo</li>
                  <li>3. Clique em <strong>"Escolher arquivo"</strong></li>
                  <li>4. Selecione o arquivo <code className="bg-muted px-1 rounded">rank-rent-tracker.zip</code></li>
                  <li>5. Clique em <strong>"Instalar Agora"</strong></li>
                  <li>6. Aguarde a instalação concluir</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="text-lg px-3">3</Badge>
              <h3 className="text-lg font-semibold">Ativar Plugin</h3>
            </div>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="text-sm">
                  Após a instalação, clique em <strong>"Ativar Plugin"</strong>. 
                  O plugin estará ativo e pronto para configuração.
                </p>
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="text-lg px-3">4</Badge>
              <h3 className="text-lg font-semibold">Configurar Plugin</h3>
            </div>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <ol className="space-y-2 text-sm">
                  <li>1. Vá em <strong>Configurações → Rank & Rent</strong></li>
                  <li>2. Preencha o <strong>Nome do Site</strong> (ex: meusite.com.br)</li>
                  <li>3. Cole a <strong>URL de Rastreamento</strong> (copiada do sistema)</li>
                  <li>4. Clique em <strong>"Salvar Configurações"</strong></li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 5 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="text-lg px-3">5</Badge>
              <h3 className="text-lg font-semibold">Testar Conexão</h3>
            </div>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <ol className="space-y-2 text-sm">
                  <li>1. Na mesma página, clique em <strong>"Testar Conexão"</strong></li>
                  <li>2. Aguarde a mensagem: <strong>"Conexão estabelecida com sucesso!"</strong></li>
                  <li>3. Se houver erro, verifique a URL e nome do site</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 6 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="text-lg px-3">6</Badge>
              <h3 className="text-lg font-semibold">Verificar Rastreamento</h3>
            </div>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <ol className="space-y-2 text-sm">
                  <li>1. Visite seu site WordPress em modo anônimo</li>
                  <li>2. Clique em alguns botões e links</li>
                  <li>3. Volte ao sistema e vá em <strong>"Analytics Avançado"</strong></li>
                  <li>4. Verifique se os eventos aparecem (pode levar 1-2 minutos)</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          {/* FAQs */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">❓ Perguntas Frequentes</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Como sei se está funcionando?</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p className="text-sm">
                    <strong>Método 1 - Console do navegador:</strong>
                  </p>
                  <ol className="text-sm space-y-1 ml-4">
                    <li>1. Abra seu site WordPress</li>
                    <li>2. Pressione F12 para abrir DevTools</li>
                    <li>3. Vá na aba "Console"</li>
                    <li>4. Clique em algum botão do site</li>
                    <li>5. Verifique se aparece mensagens do tracking</li>
                  </ol>
                  <p className="text-sm mt-3">
                    <strong>Método 2 - Analytics:</strong>
                  </p>
                  <ol className="text-sm space-y-1 ml-4">
                    <li>1. Acesse o sistema</li>
                    <li>2. Clique no site</li>
                    <li>3. Vá em "Analytics Avançado"</li>
                    <li>4. Verifique eventos recentes</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Como atualizar a URL de rastreamento?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm mb-2">
                    <strong>No WordPress:</strong>
                  </p>
                  <ol className="text-sm space-y-1 ml-4">
                    <li>1. Vá em Configurações → Rank & Rent</li>
                    <li>2. Atualize o campo "URL de Rastreamento"</li>
                    <li>3. Clique em "Salvar Configurações"</li>
                    <li>4. Teste a conexão novamente</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Plugin não rastreia - o que fazer?</AccordionTrigger>
                <AccordionContent>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Checklist de troubleshooting:</p>
                      <ol className="text-sm space-y-1 ml-4">
                        <li>✓ Plugin está ativado no WordPress?</li>
                        <li>✓ Nome do site está correto?</li>
                        <li>✓ URL de rastreamento está correta?</li>
                        <li>✓ JavaScript está habilitado no navegador?</li>
                        <li>✓ Teste de conexão passou com sucesso?</li>
                        <li>✓ Verificou o console do navegador (F12)?</li>
                        <li>✓ Aguardou 1-2 minutos após os cliques?</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>O que o plugin rastreia exatamente?</AccordionTrigger>
                <AccordionContent>
                  <ul className="text-sm space-y-2">
                    <li>✅ <strong>Page Views:</strong> Toda visualização de página</li>
                    <li>✅ <strong>Cliques em Telefone:</strong> Links tel: e botões de chamada</li>
                    <li>✅ <strong>Cliques em Email:</strong> Links mailto:</li>
                    <li>✅ <strong>Cliques em WhatsApp:</strong> Links para WhatsApp</li>
                    <li>✅ <strong>Cliques em Botões:</strong> Todos os botões e CTAs</li>
                    <li>✅ <strong>Envio de Formulários:</strong> Submissions de forms</li>
                  </ul>
                  <p className="text-sm mt-3 text-muted-foreground">
                    Além disso, detecta automaticamente números de telefone na página 
                    e captura informações de dispositivo, referrer e página atual.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

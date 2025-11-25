import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

interface InstallationGuideProps {
  trackingToken: string;
}

export const InstallationGuide = ({ trackingToken }: InstallationGuideProps) => {
  const pixelUrl = `${import.meta.env.VITE_APP_URL}/tracking/rankito-pixel.js`;
  const apiEndpoint = `${import.meta.env.VITE_APP_URL}/functions/v1/api-track`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guia de Instalação</CardTitle>
        <CardDescription>
          Instruções passo a passo para instalar o pixel em diferentes plataformas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wordpress" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            <TabsTrigger value="shopify">Shopify</TabsTrigger>
            <TabsTrigger value="gtm">Google Tag Manager</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="wordpress" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Método 1: Plugin Rankito (Recomendado)</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Baixe o plugin "Rank & Rent Tracker" na aba Integrações</li>
                <li>Instale via Plugins → Adicionar Novo → Enviar Plugin</li>
                <li>Ative o plugin</li>
                <li>
                  Configure em "RankiTO" no menu do WordPress:
                  <ul className="ml-8 mt-2 space-y-1 list-disc list-inside">
                    <li>Cole o token: <code className="bg-muted px-1 py-0.5 rounded text-xs">{trackingToken}</code></li>
                    <li>Clique em "Testar Conexão"</li>
                    <li>Salve as configurações</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <h4 className="text-sm font-medium">Método 2: Instalação Manual</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Acesse Aparência → Editor de Temas</li>
                <li>Abra o arquivo <code className="bg-muted px-1 py-0.5 rounded text-xs">header.php</code></li>
                <li>Cole o código do pixel antes do <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;/head&gt;</code></li>
                <li>Salve as alterações</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="shopify" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Instalação no Shopify</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Acesse Configurações → Checkout</li>
                <li>Role até "Scripts adicionais"</li>
                <li>Cole o código do pixel no campo "Scripts de rastreamento"</li>
                <li>Clique em "Salvar"</li>
              </ol>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Detecção Automática de E-commerce
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  O pixel detecta automaticamente eventos de e-commerce no Shopify (visualizações de produto, 
                  adicionar ao carrinho, compras) sem configuração adicional.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gtm" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Instalação via Google Tag Manager</h4>
              <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                <li>
                  <strong>Acessar o Google Tag Manager</strong>
                  <ul className="ml-8 mt-2 space-y-1 list-disc list-inside">
                    <li>Acesse <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">tagmanager.google.com</a></li>
                    <li>Selecione o contêiner do seu site</li>
                  </ul>
                </li>
                
                <li>
                  <strong>Criar Nova Tag</strong>
                  <ul className="ml-8 mt-2 space-y-1 list-disc list-inside">
                    <li>Clique em "Tags" no menu lateral</li>
                    <li>Clique no botão "Nova"</li>
                    <li>Dê um nome: "Rankito Pixel"</li>
                  </ul>
                </li>
                
                <li>
                  <strong>Configurar a Tag</strong>
                  <ul className="ml-8 mt-2 space-y-1 list-disc list-inside">
                    <li>Clique em "Configuração da tag"</li>
                    <li>Selecione "HTML Personalizado"</li>
                    <li>Cole o código do pixel (disponível acima)</li>
                    <li>Marque a opção "Suportar document.write"</li>
                  </ul>
                </li>
                
                <li>
                  <strong>Definir Acionador</strong>
                  <ul className="ml-8 mt-2 space-y-1 list-disc list-inside">
                    <li>Clique em "Acionamento"</li>
                    <li>Selecione "All Pages" (Todas as páginas)</li>
                    <li>Ou crie um acionador personalizado se preferir</li>
                  </ul>
                </li>
                
                <li>
                  <strong>Salvar e Publicar</strong>
                  <ul className="ml-8 mt-2 space-y-1 list-disc list-inside">
                    <li>Clique em "Salvar" no canto superior direito</li>
                    <li>Clique em "Enviar" para publicar as mudanças</li>
                    <li>Adicione um nome à versão (ex: "Instalação Rankito Pixel")</li>
                    <li>Clique em "Publicar"</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Integração Automática com GTM
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  O pixel detecta automaticamente eventos enviados via GTM dataLayer (purchase, add_to_cart, begin_checkout) 
                  e os sincroniza com o Rankito CRM sem configuração adicional.
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <h4 className="text-sm font-medium">Modo de Pré-visualização (Preview)</h4>
              <p className="text-xs text-muted-foreground">
                Antes de publicar, use o modo "Pré-visualizar" do GTM para testar se o pixel está disparando corretamente:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside ml-4">
                <li>Clique em "Pré-visualizar" no GTM</li>
                <li>Acesse seu site na aba que abrir</li>
                <li>Verifique se a tag "Rankito Pixel" aparece como "Tags Fired"</li>
                <li>Retorne ao Rankito e verifique se eventos estão sendo recebidos</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="html" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Instalação em Site HTML</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Abra o arquivo HTML do seu site</li>
                <li>Localize a tag <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;head&gt;</code></li>
                <li>Cole o código do pixel antes do <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;/head&gt;</code></li>
                <li>Salve e envie o arquivo para seu servidor</li>
              </ol>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <h4 className="text-sm font-medium">Rastreamento Manual de E-commerce</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Para sites HTML personalizados, use os métodos da API pública do pixel:
              </p>
              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`// Visualização de produto
window.RankitoPixel.trackProductView({
  product_name: 'Nome do Produto',
  product_id: 'SKU123',
  price: 99.90
});

// Adicionar ao carrinho
window.RankitoPixel.trackAddToCart({
  product_id: 'SKU123',
  product_name: 'Nome do Produto'
});

// Remover do carrinho
window.RankitoPixel.trackRemoveFromCart({
  product_id: 'SKU123'
});

// Iniciar checkout
window.RankitoPixel.trackBeginCheckout({
  cart_value: 199.90
});

// Compra finalizada
window.RankitoPixel.trackPurchase({
  order_id: 'ORD123',
  revenue: 199.90,
  currency: 'BRL'
});

// Busca no site
window.RankitoPixel.trackSearch({
  search_term: 'tênis esportivo'
});`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Todos os eventos são automaticamente enviados com session_id, sequence_number e metadata completa.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Testing Section */}
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-2">
          <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
            Testando a Instalação
          </h4>
          <ol className="text-xs text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
            <li>Após instalar o pixel, visite qualquer página do seu site</li>
            <li>Retorne ao Rankito e atualize esta página</li>
            <li>O badge "Instalado" aparecerá se o pixel estiver funcionando</li>
            <li>Verifique a aba "Analytics" para confirmar que eventos estão sendo rastreados</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
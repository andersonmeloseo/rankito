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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            <TabsTrigger value="shopify">Shopify</TabsTrigger>
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
                Para sites HTML personalizados, você pode disparar eventos manualmente:
              </p>
              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`// Exemplo: Rastrear visualização de produto
window.RankitoPixel.trackEvent('product_view', {
  product_name: 'Nome do Produto',
  product_id: 'SKU123',
  price: 99.90
});

// Exemplo: Rastrear compra
window.RankitoPixel.trackEvent('purchase', {
  product_name: 'Nome do Produto',
  revenue: 99.90,
  order_id: 'ORD123'
});`}
              </pre>
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Megaphone, 
  Code, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  FileCode,
  Globe,
  Smartphone,
  Server,
  Download,
  Send,
  Hash,
  Clock,
  Target
} from "lucide-react";

export const AdsTrackingSystemDoc = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Sistema de Ads Tracking</CardTitle>
              <CardDescription className="text-base">
                Documentação técnica completa: WordPress Plugin v3.1.0, JavaScript Pixel v2.0.0 e Edge Functions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Arquitetura Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Arquitetura do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-6 rounded-lg">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <Badge variant="outline" className="px-3 py-1">
                <Smartphone className="h-3 w-3 mr-1" />
                Visitante
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="px-3 py-1">
                <Code className="h-3 w-3 mr-1" />
                Plugin WP / Pixel JS
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="px-3 py-1">
                <Server className="h-3 w-3 mr-1" />
                api-track
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="px-3 py-1">
                <Database className="h-3 w-3 mr-1" />
                rank_rent_conversions
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="px-3 py-1">
                <Download className="h-3 w-3 mr-1" />
                Export Google/Meta
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Google Ads</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Captura: <code className="bg-muted px-1 rounded">gclid</code> da URL</li>
                <li>• Exporta: CSV Enhanced Conversions (7 colunas)</li>
                <li>• Hashing: SHA256 para email e telefone</li>
                <li>• Import: Google Ads → Conversões Offline</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Meta Ads</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Captura: <code className="bg-muted px-1 rounded">fbclid</code>, <code className="bg-muted px-1 rounded">_fbc</code>, <code className="bg-muted px-1 rounded">_fbp</code></li>
                <li>• Exporta: JSON ou envia direto via CAPI</li>
                <li>• API: Meta Conversions API v18</li>
                <li>• User Data: 10+ campos hasheados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed documentation */}
      <Tabs defaultValue="wordpress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="wordpress">Plugin WP</TabsTrigger>
          <TabsTrigger value="pixel">Pixel JS</TabsTrigger>
          <TabsTrigger value="api-track">api-track</TabsTrigger>
          <TabsTrigger value="google-export">Google Ads</TabsTrigger>
          <TabsTrigger value="meta-export">Meta CAPI</TabsTrigger>
        </TabsList>

        {/* WordPress Plugin Tab */}
        <TabsContent value="wordpress">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  WordPress Plugin v3.1.0
                </CardTitle>
                <Badge>rank-rent-tracker.php</Badge>
              </div>
              <CardDescription>
                Plugin completo para WordPress com tracking universal de cliques, e-commerce e ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instalação */}
              <div>
                <h4 className="font-semibold mb-2">📦 Instalação</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Baixar o arquivo <code className="bg-muted px-1 rounded">rank-rent-tracker.php</code></li>
                  <li>Fazer upload para <code className="bg-muted px-1 rounded">/wp-content/plugins/</code></li>
                  <li>Ativar o plugin no painel WordPress</li>
                  <li>Configurar a URL de tracking com token</li>
                </ol>
              </div>

              {/* Parâmetros Capturados */}
              <div>
                <h4 className="font-semibold mb-2">🎯 Parâmetros Capturados</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="font-medium text-blue-700 dark:text-blue-400 mb-2">Google Ads</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block">gclid</code>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                    <p className="font-medium text-indigo-700 dark:text-indigo-400 mb-2">Meta Ads</p>
                    <div className="space-y-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded block">fbclid</code>
                      <code className="text-xs bg-muted px-2 py-1 rounded block">_fbc (cookie)</code>
                      <code className="text-xs bg-muted px-2 py-1 rounded block">_fbp (cookie)</code>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="font-medium text-green-700 dark:text-green-400 mb-2">UTM Parameters</p>
                    <div className="space-y-1 text-xs">
                      <code className="bg-muted px-2 py-1 rounded block">utm_source</code>
                      <code className="bg-muted px-2 py-1 rounded block">utm_medium</code>
                      <code className="bg-muted px-2 py-1 rounded block">utm_campaign</code>
                      <code className="bg-muted px-2 py-1 rounded block">utm_content</code>
                      <code className="bg-muted px-2 py-1 rounded block">utm_term</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Funções JavaScript */}
              <div>
                <h4 className="font-semibold mb-2">⚙️ Funções JavaScript</h4>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-primary">getAdsTrackingData()</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Captura gclid, fbclid, cookies _fbc/_fbp e UTM params. 
                      Persiste em <code className="bg-muted px-1 rounded">sessionStorage['rankito_ads_data']</code>.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-primary">trackEvent(eventType, metadata)</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Envia eventos com ads data incluído automaticamente via fetch POST.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-primary">trackPageExit()</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rastreia saída da página com tempo gasto usando <code className="bg-muted px-1 rounded">navigator.sendBeacon</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Eventos */}
              <div>
                <h4 className="font-semibold mb-2">📊 Eventos Rastreados (12 tipos)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    'page_view', 'page_exit', 'whatsapp_click', 'phone_click',
                    'email_click', 'button_click', 'form_submit', 'product_view',
                    'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase'
                  ].map(event => (
                    <Badge key={event} variant="secondary" className="justify-center">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* JavaScript Pixel Tab */}
        <TabsContent value="pixel">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  JavaScript Pixel v2.0.0
                </CardTitle>
                <Badge>rankito-pixel.js</Badge>
              </div>
              <CardDescription>
                Pixel universal para qualquer site HTML, Shopify, WooCommerce ou com GTM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instalação */}
              <div>
                <h4 className="font-semibold mb-2">📦 Instalação</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://app.rankitocrm.com/tracking/rankito-pixel.js';
    s.setAttribute('data-token', 'SEU_TOKEN_AQUI');
    document.head.appendChild(s);
  })();
</script>`}
                </pre>
              </div>

              {/* Detecção de Plataforma */}
              <div>
                <h4 className="font-semibold mb-2">🔍 Detecção Automática de Plataforma</h4>
                <div className="grid md:grid-cols-4 gap-3">
                  {[
                    { name: 'Shopify', detect: 'window.Shopify' },
                    { name: 'WooCommerce', detect: 'woocommerce_params' },
                    { name: 'GTM', detect: 'window.dataLayer' },
                    { name: 'Generic', detect: 'Fallback HTML' }
                  ].map(platform => (
                    <div key={platform.name} className="p-3 border rounded-lg text-center">
                      <p className="font-medium">{platform.name}</p>
                      <code className="text-xs text-muted-foreground">{platform.detect}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ads Tracking */}
              <div>
                <h4 className="font-semibold mb-2">🎯 Ads Tracking (Idêntico ao Plugin WP)</h4>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    O pixel captura os mesmos parâmetros do plugin WordPress:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['gclid', 'fbclid', 'fbc', 'fbp', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map(param => (
                      <code key={param} className="bg-background px-2 py-1 rounded text-xs">{param}</code>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Persistência: <code className="bg-background px-1 rounded">sessionStorage['rankito_ads_tracking']</code>
                  </p>
                </div>
              </div>

              {/* Funcionalidades */}
              <div>
                <h4 className="font-semibold mb-2">✨ Funcionalidades Avançadas</h4>
                <ul className="space-y-2 text-sm">
                  {[
                    'Tracking universal de cliques (WhatsApp, telefone, email, botões)',
                    'E-commerce completo (product_view, add_to_cart, purchase com revenue)',
                    'Scroll tracking com profundidade (25%, 50%, 75%, 100%)',
                    'Form submission tracking automático',
                    'Session tracking com sequence_number',
                    'Page exit com tempo gasto (sendBeacon)',
                    'Interceptação de GTM dataLayer',
                    'Debounce e batching para performance'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* api-track Tab */}
        <TabsContent value="api-track">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Edge Function: api-track
                </CardTitle>
                <Badge variant="outline">POST /functions/v1/api-track</Badge>
              </div>
              <CardDescription>
                Endpoint central que recebe todos os eventos de tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endpoint */}
              <div>
                <h4 className="font-semibold mb-2">🌐 Endpoint</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
POST https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/api-track?token=TOKEN
Content-Type: application/json
                </pre>
              </div>

              {/* Campos Recebidos */}
              <div>
                <h4 className="font-semibold mb-2">📥 Campos Recebidos (Ads Tracking)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Campo</th>
                        <th className="text-left py-2 px-3">Tipo</th>
                        <th className="text-left py-2 px-3">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b"><td className="py-2 px-3"><code>gclid</code></td><td>string | null</td><td>Google Click ID</td></tr>
                      <tr className="border-b"><td className="py-2 px-3"><code>fbclid</code></td><td>string | null</td><td>Facebook Click ID</td></tr>
                      <tr className="border-b"><td className="py-2 px-3"><code>fbc</code></td><td>string | null</td><td>Facebook Cookie _fbc</td></tr>
                      <tr className="border-b"><td className="py-2 px-3"><code>fbp</code></td><td>string | null</td><td>Facebook Cookie _fbp</td></tr>
                      <tr className="border-b"><td className="py-2 px-3"><code>utm_source</code></td><td>string | null</td><td>Origem da campanha</td></tr>
                      <tr className="border-b"><td className="py-2 px-3"><code>utm_medium</code></td><td>string | null</td><td>Meio (cpc, organic, etc)</td></tr>
                      <tr className="border-b"><td className="py-2 px-3"><code>utm_campaign</code></td><td>string | null</td><td>Nome da campanha</td></tr>
                      <tr className="border-b"><td className="py-2 px-3"><code>utm_content</code></td><td>string | null</td><td>Variação do anúncio</td></tr>
                      <tr className="border-b"><td className="py-2 px-3"><code>utm_term</code></td><td>string | null</td><td>Palavra-chave</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Processamento */}
              <div>
                <h4 className="font-semibold mb-2">⚙️ Processamento</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Validação do token de autenticação</li>
                  <li>Normalização do event_type (auto-detecção para clicks)</li>
                  <li>Geolocalização via API rotation (múltiplos provedores)</li>
                  <li>Detecção de bot (user agent + geolocation patterns)</li>
                  <li>Verificação de conversion goals configuradas</li>
                  <li>Gerenciamento de sessão (create/update)</li>
                  <li>Inserção em <code className="bg-muted px-1 rounded">rank_rent_conversions</code></li>
                  <li>Herança de UTM/ads params da sessão quando ausentes</li>
                </ol>
              </div>

              {/* Response */}
              <div>
                <h4 className="font-semibold mb-2">📤 Response</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Event tracked successfully",
  "eventId": "uuid-do-evento",
  "isConversion": true,
  "goalName": "Clique WhatsApp"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Ads Export Tab */}
        <TabsContent value="google-export">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Edge Function: export-google-ads-conversions
                </CardTitle>
                <Badge className="bg-blue-500">CSV Export</Badge>
              </div>
              <CardDescription>
                Exporta conversões no formato Enhanced Conversions for Leads do Google Ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template */}
              <div>
                <h4 className="font-semibold mb-2">📋 Template Oficial (7 Colunas)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="py-2 px-3 text-left border-r">#</th>
                        <th className="py-2 px-3 text-left border-r">Coluna</th>
                        <th className="py-2 px-3 text-left">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t"><td className="py-2 px-3 border-r">1</td><td className="py-2 px-3 border-r font-mono">Google Click ID</td><td className="py-2 px-3">gclid capturado na visita</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">2</td><td className="py-2 px-3 border-r font-mono">Conversion Name</td><td className="py-2 px-3">Nome da meta ou tipo de evento</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">3</td><td className="py-2 px-3 border-r font-mono">Conversion Time</td><td className="py-2 px-3">yyyy-MM-dd HH:mm:ss timezone</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">4</td><td className="py-2 px-3 border-r font-mono">Conversion Value</td><td className="py-2 px-3">Valor monetário da conversão</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">5</td><td className="py-2 px-3 border-r font-mono">Conversion Currency</td><td className="py-2 px-3">BRL (padrão)</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">6</td><td className="py-2 px-3 border-r font-mono">Email</td><td className="py-2 px-3">SHA256 hash (Enhanced Conversions)</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">7</td><td className="py-2 px-3 border-r font-mono">Phone Number</td><td className="py-2 px-3">SHA256 hash (Enhanced Conversions)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SHA256 Hashing */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  SHA256 Hashing
                </h4>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <p><strong>Email:</strong> Normalizado para lowercase antes do hash</p>
                  <p><strong>Telefone:</strong> Apenas dígitos, formato E.164 antes do hash</p>
                  <p><strong>Validação:</strong> <code className="bg-background px-1 rounded">isValidSha256()</code> previne double-hashing</p>
                </div>
              </div>

              {/* Valores Padrão */}
              <div>
                <h4 className="font-semibold mb-2">💰 Valores Padrão por Tipo de Evento</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="p-2 border rounded text-center">
                    <p className="font-mono">whatsapp_click</p>
                    <p className="text-green-600 font-semibold">R$ 50</p>
                  </div>
                  <div className="p-2 border rounded text-center">
                    <p className="font-mono">phone_click</p>
                    <p className="text-green-600 font-semibold">R$ 40</p>
                  </div>
                  <div className="p-2 border rounded text-center">
                    <p className="font-mono">form_submit</p>
                    <p className="text-green-600 font-semibold">R$ 30</p>
                  </div>
                  <div className="p-2 border rounded text-center">
                    <p className="font-mono">email_click</p>
                    <p className="text-green-600 font-semibold">R$ 20</p>
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timezone
                </h4>
                <pre className="bg-muted p-4 rounded-lg text-sm">
Parameters:TimeZone=America/Sao_Paulo
                </pre>
              </div>

              {/* Request Example */}
              <div>
                <h4 className="font-semibold mb-2">📤 Request</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`POST /functions/v1/export-google-ads-conversions
{
  "siteId": "uuid",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "goalIds": ["goal-uuid-1", "goal-uuid-2"],
  "timezone": "America/Sao_Paulo",
  "currency": "BRL"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta CAPI Export Tab */}
        <TabsContent value="meta-export">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Edge Function: export-meta-conversions
                </CardTitle>
                <Badge className="bg-indigo-500">Meta CAPI v18</Badge>
              </div>
              <CardDescription>
                Exporta ou envia conversões diretamente para Meta Conversions API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modos */}
              <div>
                <h4 className="font-semibold mb-2">🔄 Modos de Operação</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <Badge variant="outline" className="mb-2">mode: "export"</Badge>
                    <p className="text-sm text-muted-foreground">
                      Retorna JSON formatado para download e revisão manual
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Badge variant="outline" className="mb-2">mode: "send"</Badge>
                    <p className="text-sm text-muted-foreground">
                      Envia diretamente para Meta CAPI em batches de até 1000 eventos
                    </p>
                  </div>
                </div>
              </div>

              {/* User Data Fields */}
              <div>
                <h4 className="font-semibold mb-2">👤 User Data Fields (Hasheados SHA256)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {[
                    { field: 'em', desc: 'Email' },
                    { field: 'ph', desc: 'Phone' },
                    { field: 'fbc', desc: 'FB Cookie' },
                    { field: 'fbp', desc: 'FB Pixel ID' },
                    { field: 'ct', desc: 'City' },
                    { field: 'st', desc: 'State' },
                    { field: 'country', desc: 'Country' },
                    { field: 'external_id', desc: 'Session ID' },
                    { field: 'client_ip_address', desc: 'IP' },
                    { field: 'client_user_agent', desc: 'UA' }
                  ].map(item => (
                    <div key={item.field} className="p-2 border rounded">
                      <code className="text-xs">{item.field}</code>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Mapping */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Event Mapping (Rankito → Meta)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="py-2 px-3 text-left border-r">Evento Rankito</th>
                        <th className="py-2 px-3 text-left">Evento Meta</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-t"><td className="py-2 px-3 border-r">page_view</td><td className="py-2 px-3">PageView</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">whatsapp_click</td><td className="py-2 px-3">Contact</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">phone_click</td><td className="py-2 px-3">Contact</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">email_click</td><td className="py-2 px-3">Contact</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">form_submit</td><td className="py-2 px-3">Lead</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">button_click</td><td className="py-2 px-3">Lead</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">add_to_cart</td><td className="py-2 px-3">AddToCart</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">begin_checkout</td><td className="py-2 px-3">InitiateCheckout</td></tr>
                      <tr className="border-t"><td className="py-2 px-3 border-r">purchase</td><td className="py-2 px-3">Purchase</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Test Mode */}
              <div>
                <h4 className="font-semibold mb-2">🧪 Test Mode</h4>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <p className="text-sm">
                    Inclua <code className="bg-background px-1 rounded">testEventCode</code> no request para 
                    testar sem afetar dados de produção. O código aparece no Events Manager do Meta.
                  </p>
                </div>
              </div>

              {/* Request Example */}
              <div>
                <h4 className="font-semibold mb-2">📤 Request</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`POST /functions/v1/export-meta-conversions
{
  "siteId": "uuid",
  "pixelId": "123456789",
  "accessToken": "EAAxxxxxxx",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "goalIds": ["goal-uuid-1"],
  "mode": "send",
  "testEventCode": "TEST12345"
}`}
                </pre>
              </div>

              {/* LGPD Compliance */}
              <div>
                <h4 className="font-semibold mb-2">🔒 LGPD/GDPR Compliance</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm">
{`"data_processing_options": [],
"data_processing_options_country": 0,
"data_processing_options_state": 0`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Database Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Campos no Banco de Dados
          </CardTitle>
          <CardDescription>
            Tabela: <code className="bg-muted px-2 py-1 rounded">rank_rent_conversions</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3">Campo</th>
                  <th className="text-left py-2 px-3">Tipo</th>
                  <th className="text-left py-2 px-3">Origem</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b"><td className="py-2 px-3 font-mono">gclid</td><td>text</td><td>Google Ads Click ID</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">fbclid</td><td>text</td><td>Meta Ads Click ID</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">fbc</td><td>text</td><td>Cookie _fbc</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">fbp</td><td>text</td><td>Cookie _fbp</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">utm_source</td><td>text</td><td>Origem UTM</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">utm_medium</td><td>text</td><td>Meio UTM</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">utm_campaign</td><td>text</td><td>Campanha UTM</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">utm_content</td><td>text</td><td>Conteúdo UTM</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">utm_term</td><td>text</td><td>Termo UTM</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">email</td><td>text</td><td>Email do lead</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">phone</td><td>text</td><td>Telefone do lead</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">ip_address</td><td>inet</td><td>IP do visitante</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">user_agent</td><td>text</td><td>Browser/Device</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">city</td><td>text</td><td>Cidade (geoloc)</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">region</td><td>text</td><td>Estado (geoloc)</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">country</td><td>text</td><td>País (geoloc)</td></tr>
                <tr className="border-b"><td className="py-2 px-3 font-mono">country_code</td><td>text</td><td>Código país (BR)</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Attribution Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Fluxo de Atribuição de Conversões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 1, title: 'Clique no Anúncio', desc: 'Visitante clica em anúncio Google ou Meta Ads' },
              { step: 2, title: 'URL com Parâmetros', desc: 'URL contém gclid ou fbclid + parâmetros UTM' },
              { step: 3, title: 'Captura pelo Plugin/Pixel', desc: 'Dados capturados e persistidos em sessionStorage' },
              { step: 4, title: 'Navegação no Site', desc: 'Visitante navega - dados de ads mantidos durante toda sessão' },
              { step: 5, title: 'Conversão', desc: 'Visitante converte (WhatsApp, formulário, compra, etc)' },
              { step: 6, title: 'Evento Enviado', desc: 'Evento enviado para api-track com ads tracking data incluído' },
              { step: 7, title: 'Armazenamento', desc: 'Conversão salva no banco com atribuição completa' },
              { step: 8, title: 'Exportação', desc: 'Dados exportados para Google Ads (CSV) ou Meta (CAPI)' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

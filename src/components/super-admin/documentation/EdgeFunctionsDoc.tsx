import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Globe, MessageSquare, FileText, Shield, Search, Zap, Users, TrendingUp } from "lucide-react";

export const EdgeFunctionsDoc = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Edge Functions Overview
          </CardTitle>
          <CardDescription>69 funções serverless organizadas por categoria</CardDescription>
        </CardHeader>
      </Card>

      {/* Tracking & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Tracking & Analytics
            <Badge variant="secondary">5 funções</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">api-track</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">Token</Badge></TableCell>
                <TableCell>Recebe eventos de tracking (pageview, clicks, e-commerce)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">api-external-leads</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">API Token</Badge></TableCell>
                <TableCell>Captura leads externos via API</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">mapbox-track-usage</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Registra uso da API Mapbox</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">mapbox-reset-monthly</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">Service</Badge></TableCell>
                <TableCell>Reset mensal de quota Mapbox</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">geolocation-test-api</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Testa APIs de geolocalização</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Google Search Console */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-green-600" />
            Google Search Console
            <Badge variant="secondary">25 funções</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc-instant-index</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Indexação instantânea de URLs</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc-submit-sitemap</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Submete sitemap ao GSC</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc-get-sitemaps</TableCell>
                <TableCell><Badge>GET</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Lista sitemaps do GSC</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc-check-indexation-status</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Verifica status de indexação</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc-get-quota</TableCell>
                <TableCell><Badge>GET</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Retorna quota disponível</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc-smart-scheduler</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT/Cron</Badge></TableCell>
                <TableCell>Agendamento inteligente de indexação</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc-aggregated-quota</TableCell>
                <TableCell><Badge>GET</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Quota agregada de múltiplas integrações</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc-health-check</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">Cron</Badge></TableCell>
                <TableCell>Health check de integrações GSC</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  + 17 funções adicionais de GSC (discovery, validation, scheduling, etc.)
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CRM & Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            CRM & Leads
            <Badge variant="secondary">6 funções</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">create-deal-from-external-source</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">API Token</Badge></TableCell>
                <TableCell>Cria deal de fonte externa</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">create-deal-from-whatsapp</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">API Token</Badge></TableCell>
                <TableCell>Cria deal do WhatsApp</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">auto-convert-hot-leads</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">Cron</Badge></TableCell>
                <TableCell>Converte leads quentes automaticamente</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">link-whatsapp-to-client</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Vincula WhatsApp a cliente</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">get-whatsapp-history</TableCell>
                <TableCell><Badge>GET</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Histórico de mensagens WhatsApp</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">test-external-connection</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Testa conexão externa</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            Relatórios
            <Badge variant="secondary">5 funções</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">generate-pdf-report</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Gera relatório em PDF</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">generate-excel-report</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Gera relatório em Excel</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">generate-html-report</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Gera relatório em HTML</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">generate-client-report</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Relatório para cliente final</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">generate-portal-analytics</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Analytics do portal do cliente</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Administração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Administração
            <Badge variant="secondary">12 funções</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">super-admin-create-user</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT + SuperAdmin</Badge></TableCell>
                <TableCell>Cria novo usuário</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">super-admin-reset-password</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT + SuperAdmin</Badge></TableCell>
                <TableCell>Reset de senha admin</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">admin-reset-password</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Reset senha própria</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">send-account-status-email</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Email de status de conta</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">run-system-audit</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT + SuperAdmin</Badge></TableCell>
                <TableCell>Auditoria completa do sistema</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">check-system-health</TableCell>
                <TableCell><Badge>GET</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT/Cron</Badge></TableCell>
                <TableCell>Saúde do sistema</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">check-expired-trials</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">Cron</Badge></TableCell>
                <TableCell>Verifica trials expirados</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">check-expiring-trials</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">Cron</Badge></TableCell>
                <TableCell>Trials expirando em breve</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  + 4 funções adicionais de administração
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* IndexNow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            IndexNow
            <Badge variant="secondary">3 funções</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">indexnow-submit</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Submete URLs ao IndexNow (Bing/Yandex)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">indexnow-validate-key</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Valida chave IndexNow</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">indexnow-regenerate-key</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Regenera chave IndexNow</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Portal & Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-600" />
            Portal & Clientes
            <Badge variant="secondary">5 funções</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">validate-portal-token</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">Public</Badge></TableCell>
                <TableCell>Valida token do portal do cliente</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">create-end-client</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Cria conta end-client</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">reset-end-client-password</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Reset senha end-client</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">check-plugin-status</TableCell>
                <TableCell><Badge>GET</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Status do plugin WordPress</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">send-early-access-confirmation</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Email confirmação early access</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ads & Conversions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            Ads & Conversions
            <Badge variant="secondary">2 funções</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">export-google-ads-conversions</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Export CSV para Google Ads com GCLID, Enhanced Conversions (SHA256), timezone, consent</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">export-meta-conversions</TableCell>
                <TableCell><Badge>POST</Badge></TableCell>
                <TableCell><Badge variant="outline">JWT</Badge></TableCell>
                <TableCell>Export JSON ou envio direto para Meta CAPI v18 com fbclid/fbc/fbp, user_data hash, batch até 1000</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Total:</strong> 69 Edge Functions implementadas organizadas em 9 categorias principais. 
            Todas as funções estão em produção e são acessíveis via <code className="bg-muted px-1 py-0.5 rounded">https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/[nome-funcao]</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
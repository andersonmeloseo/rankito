import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Rocket, Key, Database, Cloud, Clock, Shield } from "lucide-react";

export const DeploymentGuideDoc = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Guia de Deployment
          </CardTitle>
          <CardDescription>Configuração e deploy do sistema em produção</CardDescription>
        </CardHeader>
      </Card>

      {/* Variáveis de Ambiente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Variáveis de Ambiente Frontend
          </CardTitle>
          <CardDescription>Configuradas no arquivo .env</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variável</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Obrigatório</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">VITE_SUPABASE_URL</TableCell>
                <TableCell>URL do projeto Supabase</TableCell>
                <TableCell><Badge variant="destructive">Obrigatório</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">VITE_SUPABASE_PUBLISHABLE_KEY</TableCell>
                <TableCell>Chave pública do Supabase</TableCell>
                <TableCell><Badge variant="destructive">Obrigatório</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">VITE_SUPABASE_PROJECT_ID</TableCell>
                <TableCell>ID do projeto Supabase</TableCell>
                <TableCell><Badge variant="destructive">Obrigatório</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">VITE_APP_URL</TableCell>
                <TableCell>URL da aplicação (app.rankitocrm.com)</TableCell>
                <TableCell><Badge variant="destructive">Obrigatório</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Secrets do Backend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Secrets do Backend
          </CardTitle>
          <CardDescription>Configurados no Supabase via CLI ou Dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Secret</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usado Em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">SUPABASE_URL</TableCell>
                <TableCell>URL do Supabase</TableCell>
                <TableCell><Badge variant="outline">Edge Functions</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">SUPABASE_SERVICE_ROLE_KEY</TableCell>
                <TableCell>Chave de serviço (admin)</TableCell>
                <TableCell><Badge variant="outline">Edge Functions</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">SUPABASE_ANON_KEY</TableCell>
                <TableCell>Chave anônima pública</TableCell>
                <TableCell><Badge variant="outline">Edge Functions</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">RESEND_API_KEY</TableCell>
                <TableCell>API do Resend para emails</TableCell>
                <TableCell><Badge variant="outline">send-account-status-email</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">GOOGLE_CLIENT_ID</TableCell>
                <TableCell>OAuth Google Client ID</TableCell>
                <TableCell><Badge variant="outline">OAuth GSC</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">GOOGLE_CLIENT_SECRET</TableCell>
                <TableCell>OAuth Google Client Secret</TableCell>
                <TableCell><Badge variant="outline">OAuth GSC</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">IPGEOLOCATION_API_KEY</TableCell>
                <TableCell>API de geolocalização</TableCell>
                <TableCell><Badge variant="outline">api-track</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">SUPER_ADMIN_SECRET</TableCell>
                <TableCell>Secret para validação super admin</TableCell>
                <TableCell><Badge variant="outline">Admin Functions</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Storage Buckets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            Storage Buckets
          </CardTitle>
          <CardDescription>Buckets configurados no Supabase Storage</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                <TableHead>Público</TableHead>
                <TableHead>Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">avatars</TableCell>
                <TableCell><Badge variant="secondary">Público</Badge></TableCell>
                <TableCell>Fotos de perfil de usuários</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">extensions</TableCell>
                <TableCell><Badge variant="secondary">Público</Badge></TableCell>
                <TableCell>Plugins e extensões (WordPress, JS Pixel)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">support-attachments</TableCell>
                <TableCell><Badge variant="destructive">Privado</Badge></TableCell>
                <TableCell>Anexos de tickets de suporte</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cron Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Cron Jobs Configurados
          </CardTitle>
          <CardDescription>Jobs agendados via pg_cron</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Edge Function</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">GSC Health Check</TableCell>
                <TableCell className="font-mono text-sm">*/30 * * * *</TableCell>
                <TableCell className="font-mono text-sm">gsc-health-check</TableCell>
                <TableCell>Verifica saúde de integrações GSC a cada 30min</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Process Indexing Queue</TableCell>
                <TableCell className="font-mono text-sm">*/5 * * * *</TableCell>
                <TableCell className="font-mono text-sm">gsc-process-indexing-queue</TableCell>
                <TableCell>Processa fila de indexação a cada 5min</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Check Expired Trials</TableCell>
                <TableCell className="font-mono text-sm">0 0 * * *</TableCell>
                <TableCell className="font-mono text-sm">check-expired-trials</TableCell>
                <TableCell>Verifica trials expirados diariamente à meia-noite</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Mapbox Monthly Reset</TableCell>
                <TableCell className="font-mono text-sm">0 0 1 * *</TableCell>
                <TableCell className="font-mono text-sm">mapbox-reset-monthly</TableCell>
                <TableCell>Reset de quota Mapbox no dia 1 de cada mês</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Check Expiring Trials</TableCell>
                <TableCell className="font-mono text-sm">0 9 * * *</TableCell>
                <TableCell className="font-mono text-sm">check-expiring-trials</TableCell>
                <TableCell>Notifica trials expirando em breve às 9h diárias</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Passo a Passo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-purple-600" />
            Passo a Passo de Deploy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">1</div>
              <div>
                <h4 className="font-semibold">Clone o repositório</h4>
                <pre className="mt-2 bg-muted p-3 rounded text-sm overflow-x-auto">
git clone https://github.com/rankito/rankito-crm.git
cd rankito-crm
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">2</div>
              <div>
                <h4 className="font-semibold">Configure variáveis de ambiente</h4>
                <pre className="mt-2 bg-muted p-3 rounded text-sm overflow-x-auto">
cp .env.example .env
# Editar .env com suas credenciais
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">3</div>
              <div>
                <h4 className="font-semibold">Execute migrações do banco</h4>
                <pre className="mt-2 bg-muted p-3 rounded text-sm overflow-x-auto">
supabase link --project-ref [SEU_PROJECT_ID]
supabase db push
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">4</div>
              <div>
                <h4 className="font-semibold">Configure secrets do backend</h4>
                <pre className="mt-2 bg-muted p-3 rounded text-sm overflow-x-auto">
supabase secrets set RESEND_API_KEY=[sua-chave]
supabase secrets set GOOGLE_CLIENT_ID=[sua-chave]
# Repetir para todos os secrets
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">5</div>
              <div>
                <h4 className="font-semibold">Deploy Edge Functions</h4>
                <pre className="mt-2 bg-muted p-3 rounded text-sm overflow-x-auto">
supabase functions deploy
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">6</div>
              <div>
                <h4 className="font-semibold">Configure domínio customizado</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure CNAME DNS para app.rankitocrm.com apontando para o Supabase Project URL
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">7</div>
              <div>
                <h4 className="font-semibold">Build e deploy frontend</h4>
                <pre className="mt-2 bg-muted p-3 rounded text-sm overflow-x-auto">
npm install
npm run build
# Deploy para Vercel, Netlify ou hosting de sua escolha
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">8</div>
              <div>
                <h4 className="font-semibold">Teste integrações</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Teste Edge Functions, autenticação, tracking pixel, GSC, IndexNow e relatórios
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Este sistema está configurado para rodar no Lovable Cloud (Supabase). 
            O deployment é automatizado via Lovable CLI. Para deploy manual, siga os passos acima.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
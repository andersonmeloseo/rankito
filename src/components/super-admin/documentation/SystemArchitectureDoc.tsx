import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Code2, Palette, Zap, Database, Lock, Cloud } from "lucide-react";

export const SystemArchitectureDoc = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Stack Tecnológico
          </CardTitle>
          <CardDescription>Tecnologias e ferramentas utilizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Frontend</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React 18.3</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Vite</Badge>
                <Badge variant="secondary">React Router v6</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Estilização</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Tailwind CSS</Badge>
                <Badge variant="secondary">shadcn/ui</Badge>
                <Badge variant="secondary">Framer Motion</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Estado & Cache</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">TanStack Query</Badge>
                <Badge variant="secondary">React Context</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Backend</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Lovable Cloud (Supabase)</Badge>
                <Badge variant="secondary">Deno Deploy</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Banco de Dados</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">PostgreSQL</Badge>
                <Badge variant="secondary">66 Tabelas</Badge>
                <Badge variant="secondary">30+ Funções</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Autenticação</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Supabase Auth</Badge>
                <Badge variant="secondary">JWT</Badge>
                <Badge variant="secondary">RLS Policies</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Diretórios</CardTitle>
          <CardDescription>Organização do código-fonte</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`/src
  /components       # ~280 componentes React
    /ui            # 51 componentes shadcn/ui
    /dashboard     # Componentes do dashboard
    /super-admin   # Componentes admin
    /client-portal # Portal do cliente
    /crm           # Sistema CRM
    /gsc           # Google Search Console
    /notifications # Centro de notificações
  /hooks            # 89 custom hooks
  /pages            # 15 páginas principais
  /contexts         # Contextos globais (Auth, Role)
  /integrations     # Cliente Supabase
    /supabase
      - client.ts   # Cliente configurado
      - types.ts    # Tipos do DB (auto-gerado)
  /lib              # Utilitários
  /i18n             # Traduções (5 idiomas)

/supabase
  /functions        # 67 Edge Functions
  /migrations       # Migrações SQL
  - config.toml     # Configuração Supabase`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Código</CardTitle>
          <CardDescription>Métricas e indicadores do projeto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">~83.500</div>
              <div className="text-sm text-muted-foreground">Linhas de Código</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">280+</div>
              <div className="text-sm text-muted-foreground">Componentes React</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">89</div>
              <div className="text-sm text-muted-foreground">Custom Hooks</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">67</div>
              <div className="text-sm text-muted-foreground">Edge Functions</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">66</div>
              <div className="text-sm text-muted-foreground">Tabelas</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">15</div>
              <div className="text-sm text-muted-foreground">Páginas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Dados</CardTitle>
          <CardDescription>Arquitetura de comunicação entre camadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-32 p-2 bg-primary/10 rounded text-center font-medium">Frontend (React)</div>
              <div className="flex-1 border-t-2 border-dashed"></div>
              <div className="w-32 p-2 bg-primary/10 rounded text-center font-medium">TanStack Query</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 p-2 bg-primary/10 rounded text-center font-medium">TanStack Query</div>
              <div className="flex-1 border-t-2 border-dashed"></div>
              <div className="w-32 p-2 bg-primary/10 rounded text-center font-medium">Supabase Client</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 p-2 bg-primary/10 rounded text-center font-medium">Supabase Client</div>
              <div className="flex-1 border-t-2 border-dashed"></div>
              <div className="w-32 p-2 bg-primary/10 rounded text-center font-medium">PostgreSQL</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 p-2 bg-primary/10 rounded text-center font-medium">PostgreSQL</div>
              <div className="flex-1 border-t-2 border-dashed"></div>
              <div className="w-32 p-2 bg-primary/10 rounded text-center font-medium">Edge Functions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
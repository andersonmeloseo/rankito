import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kanban, Database, Code, Workflow, Bell, Users, Shield } from "lucide-react";

export const BacklogModuleDoc = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Módulo de Backlog & Roadmap</h2>
        <p className="text-muted-foreground">
          Sistema completo de gestão de backlog, roadmap público e solicitações de funcionalidades.
        </p>
      </div>

      {/* Visão Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Kanban className="h-5 w-5" />
            Visão Geral do Módulo
          </CardTitle>
          <CardDescription>
            Sistema integrado de gestão de desenvolvimento e feedback de usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">Core</Badge>
              <div>
                <p className="font-medium">Gestão de Backlog</p>
                <p className="text-sm text-muted-foreground">
                  Quadro Kanban com drag-and-drop para gerenciar itens de desenvolvimento através dos estágios: Planejado → Em Progresso → Em Teste → Concluído
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">Público</Badge>
              <div>
                <p className="font-medium">Roadmap Público</p>
                <p className="text-sm text-muted-foreground">
                  Timeline visual mostrando funcionalidades planejadas e implementadas (is_public=true)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">Feedback</Badge>
              <div>
                <p className="font-medium">Solicitações de Funcionalidades</p>
                <p className="text-sm text-muted-foreground">
                  Usuários podem sugerir novas funcionalidades e melhorias com sistema de votação
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">Automação</Badge>
              <div>
                <p className="font-medium">Notificações Automáticas</p>
                <p className="text-sm text-muted-foreground">
                  Notificações efusivas quando solicitações são aceitas/rejeitadas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Tabelas do Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* product_backlog */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Badge>product_backlog</Badge>
              <span className="text-sm text-muted-foreground">Items do backlog de desenvolvimento</span>
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div><span className="text-primary">id</span>: uuid (PK)</div>
              <div><span className="text-primary">title</span>: text (NOT NULL)</div>
              <div><span className="text-primary">description</span>: text</div>
              <div><span className="text-primary">category</span>: backlog_category (ENUM)</div>
              <div><span className="text-primary">status</span>: backlog_status (ENUM)</div>
              <div><span className="text-primary">priority</span>: backlog_priority (ENUM)</div>
              <div><span className="text-primary">progress_percentage</span>: integer (0-100)</div>
              <div><span className="text-primary">is_public</span>: boolean (exibir no roadmap)</div>
              <div><span className="text-primary">release_version</span>: text</div>
              <div><span className="text-primary">estimated_start_date</span>: date</div>
              <div><span className="text-primary">estimated_end_date</span>: date</div>
              <div><span className="text-primary">actual_start_date</span>: date</div>
              <div><span className="text-primary">actual_end_date</span>: date</div>
            </div>
          </div>

          {/* feature_requests */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Badge>feature_requests</Badge>
              <span className="text-sm text-muted-foreground">Solicitações de usuários</span>
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div><span className="text-primary">id</span>: uuid (PK)</div>
              <div><span className="text-primary">user_id</span>: uuid (FK → profiles)</div>
              <div><span className="text-primary">title</span>: text (NOT NULL)</div>
              <div><span className="text-primary">description</span>: text (NOT NULL)</div>
              <div><span className="text-primary">category</span>: request_category (ENUM)</div>
              <div><span className="text-primary">status</span>: request_status (ENUM)</div>
              <div><span className="text-primary">votes_count</span>: integer (default 0)</div>
              <div><span className="text-primary">linked_backlog_id</span>: uuid (FK → product_backlog)</div>
              <div><span className="text-primary">admin_notes</span>: text (notas internas)</div>
              <div><span className="text-primary">rejection_reason</span>: text</div>
            </div>
          </div>

          {/* feature_request_votes */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Badge>feature_request_votes</Badge>
              <span className="text-sm text-muted-foreground">Sistema de votação</span>
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div><span className="text-primary">id</span>: uuid (PK)</div>
              <div><span className="text-primary">request_id</span>: uuid (FK → feature_requests)</div>
              <div><span className="text-primary">user_id</span>: uuid (FK → profiles)</div>
              <div><span className="text-muted-foreground">UNIQUE(request_id, user_id)</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ENUMs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Enums do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">backlog_category</h4>
              <div className="space-y-1">
                <Badge variant="outline">new_feature</Badge>
                <Badge variant="outline">improvement</Badge>
                <Badge variant="outline">bugfix</Badge>
                <Badge variant="outline">security</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">backlog_status</h4>
              <div className="space-y-1">
                <Badge variant="outline">planned</Badge>
                <Badge variant="outline">in_progress</Badge>
                <Badge variant="outline">testing</Badge>
                <Badge variant="outline">completed</Badge>
                <Badge variant="outline">cancelled</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">backlog_priority</h4>
              <div className="space-y-1">
                <Badge variant="outline">low</Badge>
                <Badge variant="outline">medium</Badge>
                <Badge variant="outline">high</Badge>
                <Badge variant="outline">critical</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">request_category</h4>
              <div className="space-y-1">
                <Badge variant="outline">new_feature</Badge>
                <Badge variant="outline">improvement</Badge>
                <Badge variant="outline">integration</Badge>
                <Badge variant="outline">other</Badge>
              </div>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold mb-2">request_status</h4>
              <div className="space-y-1">
                <Badge variant="outline">pending</Badge>
                <Badge variant="outline">under_review</Badge>
                <Badge variant="outline">accepted</Badge>
                <Badge variant="outline">rejected</Badge>
                <Badge variant="outline">implemented</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Fluxo de Trabalho
          </CardTitle>
          <CardDescription>Jornada completa desde solicitação até implementação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="shrink-0">1</Badge>
              <div className="flex-1">
                <p className="font-medium">Solicitação do Usuário</p>
                <p className="text-sm text-muted-foreground">
                  Usuário preenche formulário com título, descrição e categoria → Cria registro em <code className="text-xs">feature_requests</code> com status <code className="text-xs">pending</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="shrink-0">2</Badge>
              <div className="flex-1">
                <p className="font-medium">Revisão do Admin</p>
                <p className="text-sm text-muted-foreground">
                  Super Admin visualiza na tabela de solicitações → Pode alterar status para <code className="text-xs">under_review</code> durante análise
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="shrink-0">3</Badge>
              <div className="flex-1">
                <p className="font-medium">Decisão: Aceitar ou Rejeitar</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Aceitar:</strong> Cria item em <code className="text-xs">product_backlog</code> + Notificação efusiva ao usuário<br />
                  <strong>Rejeitar:</strong> Define <code className="text-xs">rejection_reason</code> + Notificação de rejeição
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="shrink-0">4</Badge>
              <div className="flex-1">
                <p className="font-medium">Desenvolvimento no Kanban</p>
                <p className="text-sm text-muted-foreground">
                  Item movido através das colunas: Planejado → Em Progresso → Em Teste → Concluído
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="shrink-0">5</Badge>
              <div className="flex-1">
                <p className="font-medium">Exibição Pública</p>
                <p className="text-sm text-muted-foreground">
                  Itens com <code className="text-xs">is_public=true</code> aparecem no Roadmap Público (Dashboard → Atualizações)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componentes Frontend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Componentes Frontend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Components */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Componentes Admin (9 componentes)
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">BacklogKanban.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Quadro Kanban com drag-and-drop (@dnd-kit)</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">BacklogManagementTab.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Tab principal de gerenciamento</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">FeatureRequestsTable.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Tabela de solicitações com filtros</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">AcceptRequestDialog.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Dialog para aceitar solicitação</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">RejectRequestDialog.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Dialog para rejeitar com motivo</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">CreateBacklogItemDialog.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Criar novo item no backlog</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">EditBacklogItemDialog.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Editar item existente</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">ViewBacklogItemDialog.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Visualização somente leitura</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">ReleaseHistoryTimeline.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Timeline de releases concluídas</p>
              </div>
            </div>
          </div>

          {/* User Components */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Componentes Usuário (5 componentes)
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">PublicRoadmapTab.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Tab principal do roadmap público</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">RoadmapTimeline.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Timeline visual do roadmap</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">RoadmapCard.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Card individual de funcionalidade</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">MyRequestsList.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Lista de solicitações do usuário</p>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <code className="text-sm font-mono text-primary">RequestFeatureDialog.tsx</code>
                <p className="text-xs text-muted-foreground mt-1">Dialog para solicitar funcionalidade</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* React Hooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            React Hooks
          </CardTitle>
          <CardDescription>Custom hooks para gestão de estado e operações CRUD</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-mono text-sm mb-2 text-primary">useBacklogItems()</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Hook principal para operações CRUD do backlog (admin)
            </p>
            <div className="text-xs font-mono space-y-1 text-muted-foreground">
              <div>• <code>items</code>: BacklogItem[] - Lista de itens</div>
              <div>• <code>createItem()</code>: Criar novo item</div>
              <div>• <code>updateItem()</code>: Atualizar item existente</div>
              <div>• <code>deleteItem()</code>: Remover item</div>
              <div>• <code>isLoading</code>, <code>isCreating</code>, <code>isUpdating</code></div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-mono text-sm mb-2 text-primary">useFeatureRequests()</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Gestão de solicitações de funcionalidades
            </p>
            <div className="text-xs font-mono space-y-1 text-muted-foreground">
              <div>• <code>requests</code>: FeatureRequest[] - Lista de solicitações</div>
              <div>• <code>createRequest()</code>: Criar solicitação</div>
              <div>• <code>updateRequest()</code>: Atualizar status/notas</div>
              <div>• <code>myRequests</code>: Solicitações do usuário atual</div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-mono text-sm mb-2 text-primary">useFeatureVotes()</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Sistema de votação em solicitações
            </p>
            <div className="text-xs font-mono space-y-1 text-muted-foreground">
              <div>• <code>toggleVote(requestId)</code>: Adicionar/remover voto</div>
              <div>• <code>hasVoted(requestId)</code>: Verificar se usuário votou</div>
              <div>• Atualiza automaticamente <code>votes_count</code></div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-mono text-sm mb-2 text-primary">usePublicRoadmap()</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Itens públicos do roadmap (is_public=true)
            </p>
            <div className="text-xs font-mono space-y-1 text-muted-foreground">
              <div>• <code>publicItems</code>: Itens visíveis no roadmap</div>
              <div>• Filtrados por <code>is_public=true</code></div>
              <div>• Ordenados por prioridade e status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Sistema de Notificações Automáticas
          </CardTitle>
          <CardDescription>Notificações efusivas quando solicitações são aceitas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              ✅ Solicitação Aceita
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Título:</strong> 🎉 Parabéns! Sua sugestão foi aprovada!
              </div>
              <div>
                <strong>Mensagem:</strong> Ótimas notícias! Sua sugestão "[título]" foi aceita e será implementada em breve. Obrigado por contribuir para melhorar o Rankito CRM! 🚀
              </div>
              <div>
                <strong>Link:</strong> <code className="text-xs">/dashboard?tab=atualizacoes</code>
              </div>
              <div>
                <strong>Tipo:</strong> <code className="text-xs">feature_request_accepted</code>
              </div>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
              ❌ Solicitação Rejeitada
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Inclui:</strong> Motivo da rejeição detalhado (<code className="text-xs">rejection_reason</code>)
              </div>
              <div>
                <strong>Objetivo:</strong> Transparência e feedback construtivo ao usuário
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Principais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium text-sm">Kanban Drag-and-Drop</p>
                <p className="text-xs text-muted-foreground">Mudança de status com @dnd-kit</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium text-sm">Visibilidade Pública</p>
                <p className="text-xs text-muted-foreground">Toggle is_public por item</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium text-sm">Barra de Progresso</p>
                <p className="text-xs text-muted-foreground">Progress 0-100% com visual</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium text-sm">Versão de Release</p>
                <p className="text-xs text-muted-foreground">Agrupamento por versão</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium text-sm">Sistema de Votação</p>
                <p className="text-xs text-muted-foreground">Usuários votam em solicitações</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium text-sm">Notificações Automáticas</p>
                <p className="text-xs text-muted-foreground">Aceitar/rejeitar notifica usuário</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium text-sm">Visualização Read-Only</p>
                <p className="text-xs text-muted-foreground">Dialog de detalhes completo</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium text-sm">Timeline de Releases</p>
                <p className="text-xs text-muted-foreground">Histórico de implementações</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Info, ExternalLink } from "lucide-react";

interface AddGSCIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  onAdd: (data: { connectionName: string; serviceAccountJson: any }) => void;
  isLoading?: boolean;
}

export function AddGSCIntegrationDialog({
  open,
  onOpenChange,
  siteId,
  onAdd,
  isLoading = false,
}: AddGSCIntegrationDialogProps) {
  const [connectionName, setConnectionName] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonValidation, setJsonValidation] = useState<{
    valid: boolean;
    error?: string;
    clientEmail?: string;
  }>({ valid: false });

  const validateJSON = (input: string) => {
    if (!input.trim()) {
      setJsonValidation({ valid: false });
      return;
    }

    try {
      const parsed = JSON.parse(input);
      
      if (parsed.type !== "service_account") {
        setJsonValidation({
          valid: false,
          error: 'O campo "type" deve ser "service_account"',
        });
        return;
      }

      const requiredFields = [
        "project_id",
        "private_key_id",
        "private_key",
        "client_email",
        "client_id",
        "auth_uri",
        "token_uri",
      ];

      for (const field of requiredFields) {
        if (!parsed[field]) {
          setJsonValidation({
            valid: false,
            error: `Campo obrigatório ausente: ${field}`,
          });
          return;
        }
      }

      setJsonValidation({
        valid: true,
        clientEmail: parsed.client_email,
      });
    } catch (err) {
      setJsonValidation({
        valid: false,
        error: "JSON inválido. Verifique a formatação.",
      });
    }
  };

  const handleJSONChange = (value: string) => {
    setJsonInput(value);
    validateJSON(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectionName.trim()) {
      return;
    }

    if (!jsonValidation.valid) {
      return;
    }

    const parsedJson = JSON.parse(jsonInput);
    onAdd({
      connectionName: connectionName.trim(),
      serviceAccountJson: parsedJson,
    });
  };

  const handleClose = () => {
    setConnectionName("");
    setJsonInput("");
    setJsonValidation({ valid: false });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Integração Google Search Console</DialogTitle>
          <DialogDescription>
            Configure uma Service Account do Google Cloud para conectar ao Search Console
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="connection-name">
              Nome da Conexão <span className="text-red-500">*</span>
            </Label>
            <Input
              id="connection-name"
              placeholder="Ex: Conta Principal, Backup, etc."
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Um nome amigável para identificar esta integração
            </p>
          </div>

          {/* Service Account JSON */}
          <div className="space-y-2">
            <Label htmlFor="service-account-json">
              JSON da Service Account <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="service-account-json"
              placeholder='Cole aqui o JSON completo da Service Account...'
              value={jsonInput}
              onChange={(e) => handleJSONChange(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
              required
            />
            
            {/* Validation Badge */}
            {jsonInput && (
              <div className="flex items-center gap-2 mt-2">
                {jsonValidation.valid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      JSON válido • {jsonValidation.clientEmail}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">
                      {jsonValidation.error || "JSON inválido"}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tutorial Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-4">
              <p className="font-semibold text-base">📋 Como obter o JSON da Service Account e conectar no Search Console:</p>
              
              {/* Alert sobre 2 APIs */}
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Atenção: Você precisa ativar DUAS APIs diferentes no Google Cloud
                </p>
                <ul className="text-xs text-orange-700 mt-2 space-y-1 pl-5">
                  <li>✅ <strong>Search Console API</strong> - Para gerenciar sitemaps</li>
                  <li>✅ <strong>Web Search Indexing API</strong> - Para indexar URLs individuais</li>
                </ul>
              </div>
              
              <div className="space-y-4 text-sm">
                {/* Etapa 1 */}
                <div className="space-y-1">
                  <p className="font-semibold">1. Criar Projeto no Google Cloud</p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    <li>
                      Acesse{" "}
                      <a
                        href="https://console.cloud.google.com/projectcreate?previousPage=%2Fiam-admin%2Fserviceaccounts%2Fdetails%2F109369789572842041989%2Fkeys%3Fproject%3Dgen-lang-client-0310873852&organizationId=0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Google Cloud Console
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li><strong>Crie um novo projeto</strong> (dê um nome ao seu projeto)</li>
                  </ul>
                </div>

                {/* Etapa 2 - PRIMEIRA API */}
                <div className="space-y-1 border-l-4 border-blue-500 pl-3">
                  <p className="font-semibold text-blue-600">2. 🔌 Ativar Search Console API (1ª API)</p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    <li>
                      Acesse{" "}
                      <a
                        href="https://console.cloud.google.com/marketplace/product/google/searchconsole.googleapis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Search Console API no Marketplace
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li><strong>Selecione o projeto</strong> que você criou na etapa anterior</li>
                    <li>Clique em <strong>"Ativar"</strong> e aguarde a confirmação</li>
                    <li className="text-blue-600 font-medium">✅ Esta API é usada para gerenciar sitemaps e propriedades</li>
                  </ul>
                </div>

                {/* Etapa 3 - SEGUNDA API (CRÍTICA) */}
                <div className="space-y-1 border-l-4 border-red-500 pl-3">
                  <p className="font-semibold text-red-600">3. 🚨 Ativar Web Search Indexing API (2ª API - OBRIGATÓRIA)</p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    <li>
                      Acesse{" "}
                      <a
                        href="https://console.cloud.google.com/apis/library/indexing.googleapis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Web Search Indexing API no Marketplace
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li><strong>Selecione o mesmo projeto</strong> da etapa anterior</li>
                    <li>Clique em <strong>"Ativar"</strong> e aguarde a confirmação (pode levar alguns minutos)</li>
                    <li className="text-red-600 font-bold">⚠️ Sem esta API, a indexação individual de URLs NÃO funcionará</li>
                    <li className="text-orange-600">💡 Esta API é separada da Search Console API e ambas são necessárias</li>
                  </ul>
                </div>

                {/* Etapa 4 */}
                <div className="space-y-1">
                  <p className="font-semibold">4. 👤 Criar Conta de Serviço</p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    <li>No menu lateral, vá em <code className="bg-muted px-1 py-0.5 rounded text-xs">IAM e Admin</code> → <code className="bg-muted px-1 py-0.5 rounded text-xs">Contas de Serviço</code></li>
                    <li>Clique em <strong>"+ Criar Conta de Serviço"</strong></li>
                    <li>Dê um nome (normalmente o nome do seu site)</li>
                    <li>Clique em <strong>"Criar e Continuar"</strong> e depois <strong>"Concluir"</strong></li>
                    <li>Verifique que o email foi criado e o status está <strong>ativado</strong></li>
                  </ul>
                </div>

                {/* Etapa 5 */}
                <div className="space-y-1">
                  <p className="font-semibold">5. 🔑 Gerar Chave JSON</p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    <li>Na lista de contas de serviço, localize o email que você criou</li>
                    <li>Clique nos <strong>três pontos</strong> (Ações) e depois em <strong>"Gerenciar Chaves"</strong></li>
                    <li>Clique em <strong>"Adicionar Chave"</strong> → <strong>"Criar Nova Chave"</strong></li>
                    <li>Escolha o formato <strong>"JSON"</strong></li>
                    <li><strong>Salve o arquivo JSON</strong> que será baixado automaticamente</li>
                    <li>Cole o conteúdo completo do arquivo JSON no campo acima</li>
                  </ul>
                </div>

                {/* Etapa 6 - CRÍTICA */}
                <div className="space-y-1 border-l-4 border-orange-500 pl-3">
                  <p className="font-semibold text-orange-600">6. 🚨 Adicionar Permissões no Search Console (CRÍTICO)</p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    <li>
                      Acesse{" "}
                      <a
                        href="https://search.google.com/search-console"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Google Search Console
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li><strong>Busque pelo seu domínio</strong> na lista de propriedades</li>
                    <li>No menu lateral (final da página), clique em <strong>"Configurações"</strong></li>
                    <li>Clique em <strong>"Usuários e Permissões"</strong></li>
                    <li>Clique em <strong>"Adicionar Usuário"</strong></li>
                    <li>Cole o <strong>email da Service Account</strong> (client_email do JSON) no campo "Endereço de Email"</li>
                    <li>Selecione a permissão <strong>"Proprietário"</strong></li>
                    <li>Clique em <strong>"Adicionar"</strong></li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !connectionName.trim() || !jsonValidation.valid}
            >
              {isLoading ? "Salvando..." : "Salvar e Conectar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
            <AlertDescription className="space-y-3">
              <p className="font-semibold">Como obter o JSON da Service Account:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Acesse o{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Google Cloud Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Crie um novo projeto ou selecione um existente</li>
                <li>
                  Ative as APIs:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    Google Search Console API
                  </code>{" "}
                  e{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    Web Search Indexing API
                  </code>
                </li>
                <li>Vá em "Credenciais" → "Criar credenciais" → "Conta de serviço"</li>
                <li>Após criar, clique na conta criada e vá em "Chaves"</li>
                <li>Clique em "Adicionar chave" → "Criar nova chave" → "JSON"</li>
                <li>O arquivo JSON será baixado automaticamente - cole o conteúdo acima</li>
                <li>
                  <strong className="text-orange-600">IMPORTANTE:</strong> Adicione o email da Service Account
                  (client_email) como <strong>proprietário ou delegado</strong> no{" "}
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
              </ol>
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

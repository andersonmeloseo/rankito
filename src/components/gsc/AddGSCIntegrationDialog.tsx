import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ExternalLink } from 'lucide-react';

interface AddGSCIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  onAdd: (data: {
    site_id: string;
    connection_name: string;
    google_email: string;
    google_client_id: string;
    google_client_secret: string;
  }) => void;
  isLoading?: boolean;
}

export const AddGSCIntegrationDialog = ({
  open,
  onOpenChange,
  siteId,
  onAdd,
  isLoading = false,
}: AddGSCIntegrationDialogProps) => {
  const [formData, setFormData] = useState({
    connection_name: '',
    google_email: '',
    google_client_id: '',
    google_client_secret: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      site_id: siteId,
      ...formData,
    });
  };

  const handleClose = () => {
    setFormData({
      connection_name: '',
      google_email: '',
      google_client_id: '',
      google_client_secret: '',
    });
    onOpenChange(false);
  };

  const redirectUri = `${import.meta.env.VITE_APP_URL}/gsc-callback`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Integração Google Search Console</DialogTitle>
          <DialogDescription>
            Configure uma nova conexão com o Google Search Console para gerenciar indexação
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tutorial Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold">Antes de começar, você precisa:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Ter um projeto no Google Cloud Console</li>
                <li>Ativar as APIs: "Google Search Console API" e "Indexing API"</li>
                <li>Criar credenciais OAuth 2.0 (tipo "Aplicativo da Web")</li>
                <li>Adicionar a URI de redirecionamento autorizada abaixo</li>
              </ol>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-sm mt-2"
              >
                Abrir Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          {/* Redirect URI */}
          <div className="space-y-2">
            <Label>URI de Redirecionamento Autorizada</Label>
            <div className="flex gap-2">
              <Input
                value={redirectUri}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(redirectUri)}
              >
                Copiar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole esta URI nas configurações do seu projeto OAuth no Google Cloud Console
            </p>
          </div>

          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="connection_name">
              Nome da Conexão <span className="text-destructive">*</span>
            </Label>
            <Input
              id="connection_name"
              placeholder="Ex: Conta Principal, Conta Cliente, etc."
              value={formData.connection_name}
              onChange={(e) => setFormData({ ...formData, connection_name: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Um nome para identificar esta integração
            </p>
          </div>

          {/* Google Email */}
          <div className="space-y-2">
            <Label htmlFor="google_email">
              E-mail Google <span className="text-destructive">*</span>
            </Label>
            <Input
              id="google_email"
              type="email"
              placeholder="exemplo@gmail.com"
              value={formData.google_email}
              onChange={(e) => setFormData({ ...formData, google_email: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              O e-mail da conta Google que tem acesso ao Search Console
            </p>
          </div>

          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="google_client_id">
              Client ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="google_client_id"
              placeholder="123456789012-abc...xyz.apps.googleusercontent.com"
              value={formData.google_client_id}
              onChange={(e) => setFormData({ ...formData, google_client_id: e.target.value })}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Obtido nas credenciais OAuth 2.0 do Google Cloud Console
            </p>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="google_client_secret">
              Client Secret <span className="text-destructive">*</span>
            </Label>
            <Input
              id="google_client_secret"
              type="password"
              placeholder="GOCSPX-..."
              value={formData.google_client_secret}
              onChange={(e) => setFormData({ ...formData, google_client_secret: e.target.value })}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Obtido nas credenciais OAuth 2.0 do Google Cloud Console
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar e Conectar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddGBPIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteUrl: string;
  onSuccess: () => void;
}

export function AddGBPIntegrationDialog({
  open,
  onOpenChange,
  siteId,
  onSuccess,
}: AddGBPIntegrationDialogProps) {
  const [connectionName, setConnectionName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWithGoogle = async () => {
    if (!connectionName.trim()) {
      toast.error('Digite um nome para a conexão');
      return;
    }

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gbp-oauth-authorize', {
        body: { site_id: siteId },
      });

      if (error) throw error;
      if (!data?.authorization_url) throw new Error('URL de autorização não recebida');

      localStorage.setItem('gbp_connection_name', connectionName);
      localStorage.setItem('gbp_oauth_state', data.state);

      window.location.href = data.authorization_url;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar conexão OAuth2');
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar Google Business Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="connection-name">Nome da Conexão</Label>
            <Input
              id="connection-name"
              placeholder="Ex: Meu Negócio - GBP"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              disabled={isConnecting}
            />
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Ao clicar em "Conectar com Google", você será redirecionado para autorizar o acesso ao seu Google Business Profile.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConnecting}>
              Cancelar
            </Button>
            <Button onClick={handleConnectWithGoogle} disabled={isConnecting || !connectionName.trim()}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar com Google'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

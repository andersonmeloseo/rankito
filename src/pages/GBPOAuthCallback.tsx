import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GBPOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autorização...');

  useEffect(() => {
    const processOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Autorização negada pelo Google');
        toast.error('Autorização cancelada');
        setTimeout(() => navigate('/dashboard?tab=gbp'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Parâmetros de autorização inválidos');
        toast.error('Erro na autorização');
        setTimeout(() => navigate('/dashboard?tab=gbp'), 3000);
        return;
      }

      try {
        // Recuperar connection_name do localStorage
        const connectionName = localStorage.getItem('gbp_connection_name') || 'Minha Conexão GBP';
        const oauthState = localStorage.getItem('gbp_oauth_state');

        // Limpar localStorage
        localStorage.removeItem('gbp_connection_name');
        localStorage.removeItem('gbp_oauth_state');

        // Validar state
        if (state !== oauthState) {
          throw new Error('Estado OAuth inválido');
        }

        setMessage('Conectando ao Google Business Profile...');

        // Chamar edge function para completar o OAuth
        const { data, error: callbackError } = await supabase.functions.invoke('gbp-oauth-callback', {
          body: {
            code,
            state,
            connection_name: connectionName,
          },
        });

        if (callbackError) throw callbackError;
        if (data?.error) throw new Error(data.error);

        setStatus('success');
        setMessage('Perfil GBP conectado com sucesso!');
        toast.success('Google Business Profile conectado com sucesso!');
        
        setTimeout(() => navigate('/dashboard?tab=gbp'), 2000);
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Erro ao conectar com Google Business Profile');
        toast.error('Erro na conexão: ' + (error.message || 'Erro desconhecido'));
        setTimeout(() => navigate('/dashboard?tab=gbp'), 3000);
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-lg text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Conectando...</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Sucesso!</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">Redirecionando...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Erro</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">Redirecionando...</p>
          </>
        )}
      </div>
    </div>
  );
}

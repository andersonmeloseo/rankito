import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function GSCCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [siteId, setSiteId] = useState<string | null>(null);
  
  useEffect(() => {
    processCallback();
  }, []);
  
  const processCallback = async () => {
    try {
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Verificar sucesso
      const success = searchParams.get('gsc_success');
      const integrationId = searchParams.get('integration_id');
      
      if (success === 'true' && integrationId) {
        // Buscar site_id da integração
        const { data, error } = await supabase
          .from('google_search_console_integrations')
          .select('site_id, connection_name')
          .eq('id', integrationId)
          .single();
        
        if (error || !data) {
          setStatus('error');
          setMessage('A integração foi removida. Por favor, crie uma nova.');
          return;
        }
        
        setSiteId(data.site_id);
        setStatus('success');
        setMessage(`Integração "${data.connection_name}" conectada com sucesso!`);
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate(`/dashboard/site/${data.site_id}?tab=gsc`);
        }, 3000);
        return;
      }
      
      // Verificar erro
      const errorType = searchParams.get('gsc_error');
      
      if (errorType) {
        setStatus('error');
        
        // Mapear tipos de erro para mensagens user-friendly
        const errorMessages: Record<string, string> = {
          access_denied: 'Você negou permissão ao Google Search Console. Tente novamente.',
          missing_params: 'Parâmetros de autenticação ausentes. Tente reconectar.',
          invalid_state: 'Token de segurança inválido. Por favor, tente novamente.',
          state_expired: 'Sessão de autenticação expirou. Inicie novamente o processo.',
          integration_not_found: 'Integração não encontrada. Por favor, reconfigure.',
          update_failed: 'Falha ao salvar credenciais. Tente novamente.',
          unknown: 'Erro inesperado. Entre em contato com o suporte.'
        };
        
        setMessage(errorMessages[errorType] || errorMessages.unknown);
        return;
      }
      
      // Se não há nem sucesso nem erro, URL inválida
      setStatus('error');
      setMessage('URL de callback inválida. Por favor, tente novamente.');
      
    } catch (err) {
      console.error('GSC Callback Error:', err);
      setStatus('error');
      setMessage('Erro ao carregar dados da integração. Tente novamente.');
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {status === 'loading' && (
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="Carregando" />
              Processando autenticação...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Aguarde enquanto validamos sua conexão com o Google Search Console.
            </p>
          </CardContent>
        </Card>
      )}
      
      {status === 'success' && (
        <Card className="max-w-md w-full border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-6 w-6" />
              Conexão estabelecida!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-green-600 dark:text-green-300">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o painel do projeto em 3 segundos...
            </p>
            <Button 
              onClick={() => navigate(`/dashboard/site/${siteId}?tab=gsc`)}
              className="w-full"
            >
              Ir para o painel agora
            </Button>
          </CardContent>
        </Card>
      )}
      
      {status === 'error' && (
        <Card className="max-w-md w-full border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-6 w-6" />
              Falha na autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-600 dark:text-red-300">{message}</p>
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Voltar para o Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

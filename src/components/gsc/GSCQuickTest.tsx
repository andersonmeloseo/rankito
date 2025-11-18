import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GSCQuickTestProps {
  siteId: string;
  siteUrl: string;
}

export const GSCQuickTest = ({ siteId, siteUrl }: GSCQuickTestProps) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const { toast } = useToast();

  const handleQuickTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Testando Web Search Indexing API...');
      
      // Tenta indexar a homepage do site
      const testUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
      
      const { data, error } = await supabase.functions.invoke('gsc-request-indexing', {
        body: {
          site_id: siteId,
          url: testUrl,
          request_type: 'URL_UPDATED',
        },
      });

      if (error) {
        console.error('❌ Erro no teste:', error);
        
        // Detectar erro específico da API não habilitada
        if (error.message?.includes('Web Search Indexing API has not been used') ||
            error.message?.includes('SERVICE_DISABLED') ||
            error.message?.includes('API not enabled')) {
          setTestResult({
            success: false,
            message: '❌ Web Search Indexing API ainda NÃO está habilitada',
            details: 'Aguarde 2-3 minutos e tente novamente. A API pode levar alguns minutos para propagar após ativação.',
          });
        } else if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
          setTestResult({
            success: false,
            message: '❌ Erro de permissão (403)',
            details: 'Verifique se a Service Account tem permissão de PROPRIETÁRIO no GSC e se a URL da propriedade está correta.',
          });
        } else {
          setTestResult({
            success: false,
            message: `❌ Erro: ${error.message}`,
            details: JSON.stringify(error, null, 2),
          });
        }
        
        toast({
          title: "Teste falhou",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Teste bem-sucedido:', data);
      
      setTestResult({
        success: true,
        message: '✅ Web Search Indexing API está funcionando!',
        details: `URL indexada com sucesso: ${testUrl}\nIntegração usada: ${data.integration_used?.name}\nQuota restante: ${data.quota?.remaining}/${data.quota?.limit}`,
      });

      toast({
        title: "✅ API Funcionando!",
        description: "A Web Search Indexing API está configurada corretamente.",
      });

    } catch (err: any) {
      console.error('❌ Erro inesperado:', err);
      setTestResult({
        success: false,
        message: '❌ Erro inesperado ao testar',
        details: err.message || String(err),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Teste Rápido da API
        </CardTitle>
        <CardDescription>
          Valide se a Web Search Indexing API está habilitada e funcionando
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleQuickTest} 
          disabled={testing}
          className="w-full"
          size="lg"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando API...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Testar Web Search Indexing API
            </>
          )}
        </Button>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <AlertDescription className="font-semibold">
                  {testResult.message}
                </AlertDescription>
                {testResult.details && (
                  <AlertDescription className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {testResult.details}
                  </AlertDescription>
                )}
              </div>
            </div>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>O que este teste faz:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Tenta indexar a homepage do seu site no Google</li>
            <li>Verifica se a Web Search Indexing API está ativa</li>
            <li>Valida permissões da Service Account</li>
            <li>Confirma que a URL da propriedade está correta</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

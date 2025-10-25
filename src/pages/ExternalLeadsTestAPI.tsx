import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function ExternalLeadsTestAPI() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const apiToken = urlParams.get('token');

        if (!apiToken) {
          setResult({
            success: false,
            error: 'Token não fornecido',
            message: 'Adicione ?token=SEU_TOKEN na URL'
          });
          setStatus('error');
          return;
        }

        // Validate token
        const { data: source, error } = await supabase
          .from('external_lead_sources')
          .select('source_name, source_type, is_active, user_id')
          .eq('api_token', apiToken)
          .single();

        if (error || !source) {
          setResult({
            success: false,
            error: 'Token inválido',
            message: 'O token fornecido não existe ou está inativo'
          });
          setStatus('error');
          return;
        }

        if (!source.is_active) {
          setResult({
            success: false,
            error: 'Integração desativada',
            message: 'Esta integração existe mas está desativada no CRM'
          });
          setStatus('error');
          return;
        }

        setResult({
          success: true,
          integration_name: source.source_name,
          integration_type: source.source_type,
          is_active: true,
          message: 'Token válido! Integração funcionando corretamente.'
        });
        setStatus('success');

      } catch (error) {
        console.error('Test error:', error);
        setResult({
          success: false,
          error: 'Erro ao testar conexão',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        setStatus('error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {status === 'loading' && (
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              )}
              {status === 'success' && (
                <CheckCircle className="w-12 h-12 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="w-12 h-12 text-red-500" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">
                {status === 'loading' && 'Testando conexão...'}
                {status === 'success' && '✓ Conexão OK'}
                {status === 'error' && '✗ Conexão Falhou'}
              </h2>
              
              {result && (
                <div className="text-left mt-4">
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

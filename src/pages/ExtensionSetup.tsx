import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle, Chrome, Copy } from 'lucide-react';

export default function ExtensionSetup() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for token save confirmation from extension
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'RANKITO_TOKEN_SAVED') {
        setSuccess(true);
        toast.success('✅ Extensão configurada com sucesso!');
        
        setTimeout(() => {
          window.location.href = 'https://web.whatsapp.com';
        }, 2000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    if (!token.trim()) {
      toast.error('Por favor, cole seu token da API');
      return;
    }

    setLoading(true);

    // Send token to extension via postMessage
    window.postMessage({ 
      type: 'RANKITO_SAVE_TOKEN', 
      token: token.trim()
    }, '*');

    // Set a timeout in case extension doesn't respond
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text);
      toast.success('Token colado!');
    } catch (err) {
      toast.error('Não foi possível colar. Use Ctrl+V manualmente.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tudo pronto!</h1>
          <p className="text-gray-600 mb-4">
            Sua extensão foi configurada com sucesso.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando para o WhatsApp Web...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Chrome className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            🎉 Bem-vindo ao Rankito CRM
          </h1>
          <p className="text-gray-600">
            Para começar, cole seu token da API abaixo
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Token da API</label>
            <div className="flex gap-2">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole seu token aqui..."
                className="font-mono text-sm"
                onPaste={(e) => {
                  // Auto-trim on paste
                  setTimeout(() => {
                    setToken(e.currentTarget.value.trim());
                  }, 0);
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={pasteFromClipboard}
                title="Colar da área de transferência"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={handleConnect} 
            disabled={!token.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Conectando...
              </>
            ) : (
              <>
                <Chrome className="w-4 h-4 mr-2" />
                Conectar Extensão
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-500 text-center">
            Não tem um token? {' '}
            <a href="/dashboard" className="text-blue-600 hover:underline font-medium">
              Criar agora
            </a>
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Próximo passo:</strong> Após conectar, abra o WhatsApp Web para começar a capturar leads!
          </p>
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-gray-500 text-center">
            Para obter seu token, acesse: <br />
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
              Dashboard → Integrações → Nova Integração
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

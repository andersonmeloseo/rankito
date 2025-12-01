import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const PendingApproval = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-background dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center animate-pulse">
              <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-500 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Conta Aguardando Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="space-y-3 ml-2">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                Sua conta está sendo analisada pela nossa equipe
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Você receberá um email assim que seu cadastro for aprovado. 
                Este processo geralmente leva até 24 horas durante dias úteis.
              </p>
              <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>Dica:</strong> Verifique sua caixa de spam caso não receba o email na caixa de entrada.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button 
              className="w-full h-11 font-semibold transition-all active:scale-[0.98]"
              onClick={() => window.location.href = '/'}
            >
              Voltar para Home
            </Button>
            <Button 
              variant="outline"
              className="w-full h-11 font-semibold transition-all active:scale-[0.98]"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;

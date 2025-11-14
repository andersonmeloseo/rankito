import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { PhoneInput } from 'react-international-phone';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Session } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Detectar plano selecionado via URL
  const searchParams = new URLSearchParams(location.search);
  const selectedPlanSlug = searchParams.get('plan');

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // 🔥 Função para recuperar localização preservada
  const getPreservedLocation = () => {
    // Tentar pegar do location.state primeiro (caso venha de navegação normal)
    const stateFrom = (location.state as any)?.from;
    if (stateFrom?.pathname && stateFrom.pathname !== '/auth') {
      return stateFrom;
    }
    
    // Se não tiver no state, tentar pegar do sessionStorage (caso de F5)
    const stored = sessionStorage.getItem('redirectAfterAuth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.pathname && parsed.pathname !== '/auth') {
          return parsed;
        }
      } catch (e) {
        console.error('Erro ao parsear redirectAfterAuth:', e);
      }
    }
    
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      if (session && !hasRedirected) {
        setHasRedirected(true);
        const from = getPreservedLocation();
        console.log('🔍 [Auth onAuthStateChange] from:', from);
        
        // Dar prioridade para rotas preservadas, mas evitar loop com /auth
        if (from?.pathname && from.pathname !== '/auth' && from.pathname !== '/') {
          const fullPath = `${from.pathname}${from.search || ''}${from.hash || ''}`;
          console.log('✅ [Auth] Redirecionando para localização preservada:', fullPath);
          sessionStorage.removeItem('redirectAfterAuth');
          navigate(fullPath, { replace: true });
        } else {
          console.log('✅ [Auth] Redirecionando para /dashboard (sem localização preservada)');
          sessionStorage.removeItem('redirectAfterAuth');
          navigate("/dashboard", { replace: true });
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      if (session && !hasRedirected) {
        setHasRedirected(true);
        const from = getPreservedLocation();
        console.log('🔍 [Auth getSession] from:', from);
        
        // Dar prioridade para rotas preservadas, mas evitar loop com /auth
        if (from?.pathname && from.pathname !== '/auth' && from.pathname !== '/') {
          const fullPath = `${from.pathname}${from.search || ''}${from.hash || ''}`;
          console.log('✅ [Auth] Redirecionando para localização preservada:', fullPath);
          sessionStorage.removeItem('redirectAfterAuth');
          navigate(fullPath, { replace: true });
        } else {
          console.log('✅ [Auth] Redirecionando para /dashboard (sem localização preservada)');
          sessionStorage.removeItem('redirectAfterAuth');
          navigate("/dashboard", { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || fullName.trim().length < 3) {
      toast({
        title: "Nome inválido",
        description: "O nome completo deve ter pelo menos 3 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!whatsapp || whatsapp.length < 8) {
      toast({
        title: "WhatsApp inválido",
        description: "Por favor, insira um número de WhatsApp válido",
        variant: "destructive",
      });
      return;
    }

    if (website && !website.startsWith('http')) {
      toast({
        title: "Website inválido",
        description: "O website deve começar com http:// ou https://",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Atualizar profile com dados adicionais e plano selecionado (usando any para contornar type check)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            whatsapp: whatsapp,
            website: website || null,
            selected_plan_slug: selectedPlanSlug,
          } as any)
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        // Mostrar mensagem de sucesso e aguardar aprovação
        setRegistrationSuccess(true);
        
        // Fazer logout para prevenir acesso antes da aprovação
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se a conta está aprovada
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error checking profile:', profileError);
        }

        if (profile && !profile.is_active) {
          // Conta não aprovada, fazer logout
          await supabase.auth.signOut();
          
          toast({
            title: "Conta aguardando aprovação",
            description: "Sua conta ainda não foi aprovada pela nossa equipe. Você receberá um email quando sua conta for ativada.",
            variant: "destructive",
          });
          
          setLoading(false);
          return;
        }
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });

      if (!hasRedirected) {
        setHasRedirected(true);
        const from = getPreservedLocation();
        console.log('🔍 [handleSignIn] from:', from);
        
        // Dar prioridade para rotas preservadas, mas evitar loop com /auth
        if (from?.pathname && from.pathname !== '/auth' && from.pathname !== '/') {
          const fullPath = `${from.pathname}${from.search || ''}${from.hash || ''}`;
          console.log('✅ [handleSignIn] Redirecionando para localização preservada:', fullPath);
          sessionStorage.removeItem('redirectAfterAuth');
          navigate(fullPath, { replace: true });
        } else {
          console.log('✅ [handleSignIn] Redirecionando para /dashboard (sem localização preservada)');
          sessionStorage.removeItem('redirectAfterAuth');
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email necessário",
        description: "Por favor, insira seu email primeiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const redirectUrl = `${window.location.origin}/auth`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    }

    setLoading(false);
  };

  // Mostrar tela de sucesso após cadastro
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-background dark:to-gray-900 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Cadastro Enviado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <AlertDescription className="text-center space-y-3">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Sua conta foi criada com sucesso!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Nossa equipe validará seu cadastro em até 24 horas. Você receberá um email de confirmação assim que sua conta for aprovada.
                </p>
                {selectedPlanSlug && (
                  <div className="pt-2">
                    <Badge variant="outline" className="bg-white dark:bg-gray-900">
                      Plano selecionado: <span className="font-semibold ml-1 capitalize">{selectedPlanSlug}</span>
                    </Badge>
                  </div>
                )}
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full h-11 font-semibold transition-all active:scale-[0.98]"
              onClick={() => window.location.href = '/'}
            >
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-background dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">R</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
            Rankito CRM
          </CardTitle>
          <CardDescription className="text-center text-base">
            Sistema de Gestão de Rank n Rent
          </CardDescription>
          {selectedPlanSlug && (
            <div className="flex justify-center pt-2">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                Plano: <span className="font-semibold ml-1 capitalize">{selectedPlanSlug}</span>
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin" className="text-sm font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email-signin"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin" className="text-sm font-semibold">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password-signin"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10 transition-all focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 font-normal text-sm"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Esqueceu sua senha?
                </Button>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname-signup" className="text-sm font-semibold">
                    Nome Completo
                  </Label>
                  <Input
                    id="fullname-signup"
                    type="text"
                    placeholder="Seu Nome Completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-sm font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="text-sm font-semibold">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password-signup"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pr-10 transition-all focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-signup" className="text-sm font-semibold">
                    WhatsApp
                  </Label>
                  <PhoneInput
                    defaultCountry="br"
                    value={whatsapp}
                    onChange={(phone) => setWhatsapp(phone)}
                    placeholder="Digite seu WhatsApp"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-signup" className="text-sm font-semibold">
                    Website (opcional)
                  </Label>
                  <Input
                    id="website-signup"
                    type="url"
                    placeholder="https://seusite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // 🔥 Verificar se existe localização preservada no sessionStorage
        const stored = sessionStorage.getItem('redirectAfterAuth');
        
        if (stored) {
          try {
            const preserved = JSON.parse(stored);
            if (preserved?.pathname && preserved.pathname !== '/' && preserved.pathname !== '/auth') {
              const fullPath = `${preserved.pathname}${preserved.search || ''}${preserved.hash || ''}`;
              console.log('🏠 [Index] Redirecionando para localização preservada:', fullPath);
              sessionStorage.removeItem('redirectAfterAuth');
              navigate(fullPath, { replace: true });
              return;
            }
          } catch (e) {
            console.error('Erro ao parsear sessionStorage:', e);
          }
        }
        
        // Se não houver localização preservada, vai para /dashboard
        console.log('🏠 [Index] Usuário autenticado, redirecionando para /dashboard');
        navigate('/dashboard', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type AppRole = 'super_admin' | 'client' | 'end_client' | null;

interface RoleContextType {
  role: AppRole;
  user: User | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isClient: boolean;
  isEndClient: boolean;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = async () => {
    // Use getSession() instead of getUser() for faster session restoration
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (!error && data) {
        setRole(data.role as AppRole);
      } else {
        setRole(null);
      }
    } else {
      setUser(null);
      setRole(null);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Only synchronous state updates here
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setTimeout(() => {
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle()
              .then(({ data }) => {
                const userRole = data?.role as AppRole || null;
                setRole(userRole);
                
                // Log de diagnóstico para usuários sem role
                if (!userRole) {
                  console.error('⚠️ USUÁRIO SEM ROLE:', {
                    userId: session.user.id,
                    email: session.user.email,
                    message: 'Este usuário não tem role atribuída. Entre em contato com o suporte.'
                  });
                }
              });
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
        user,
        isLoading,
        isSuperAdmin: role === 'super_admin',
        isClient: role === 'client',
        isEndClient: role === 'end_client',
        refreshRole: fetchRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};

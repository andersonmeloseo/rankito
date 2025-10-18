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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUser(user);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
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
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          
          // Buscar role diretamente sem chamar fetchRole()
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          setRole(data?.role as AppRole || null);
        } else {
          setUser(null);
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

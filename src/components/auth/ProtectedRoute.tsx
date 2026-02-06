import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'client' | 'end_client';
}

/**
 * ProtectedRoute - Optimized authentication guard
 * 
 * Uses RoleContext for auth state (no duplicate auth requests).
 * Only fetches profile when needed for approval check.
 */
export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, isLoading } = useRole();
  const location = useLocation();

  // Only check profile for approval status (uses cache from AppDataProvider)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1800000, // 30 minutes - matches AppDataProvider
    gcTime: 3600000,
  });

  // Loading state - blocks rendering
  if (isLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Account not approved - redirect to pending page
  if (profile && !profile.is_active) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Role check if required
  if (requiredRole && role !== requiredRole) {
    // Redirect based on user role
    if (role === 'end_client') {
      return <Navigate to="/end-client-portal" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Render protected component
  return <>{children}</>;
};

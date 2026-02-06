import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';

interface AppDataContextType {
  isReady: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Fetch functions for prefetching
const fetchUserSites = async (userId: string) => {
  const { data, error } = await supabase
    .rpc("get_sites_with_metrics", { p_user_id: userId });
  if (error) throw error;
  return data;
};

const fetchSubscriptionLimits = async (userId: string) => {
  const { data, error } = await supabase.rpc('get_subscription_limits_data', {
    p_user_id: userId
  });
  if (error) throw error;
  return data;
};

const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

/**
 * AppDataProvider - Prefetch essential data on login
 * 
 * This provider runs ONCE when user logs in and prefetches:
 * - User's sites list (used in Dashboard, SitesList, etc.)
 * - Subscription/limits (used in Dashboard, AddSite, etc.)
 * - User profile (used in Header, Dashboard, Settings)
 * 
 * All data is cached with long staleTime to avoid re-fetching
 * during navigation between pages.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: roleLoading } = useRole();
  const queryClient = useQueryClient();

  // Prefetch essential data in PARALLEL when user is available
  useEffect(() => {
    if (roleLoading || !user?.id) return;

    // Fire all prefetch queries simultaneously
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['rank-rent-site-metrics', user.id],
        queryFn: () => fetchUserSites(user.id),
        staleTime: 300000, // 5 minutes - sites rarely change
        gcTime: 600000,    // 10 minutes in memory
      }),
      queryClient.prefetchQuery({
        queryKey: ['subscription-limits'],
        queryFn: () => fetchSubscriptionLimits(user.id),
        staleTime: 600000, // 10 minutes - plan almost never changes
        gcTime: 900000,    // 15 minutes in memory
      }),
      queryClient.prefetchQuery({
        queryKey: ['user-profile', user.id],
        queryFn: () => fetchProfile(user.id),
        staleTime: 1800000, // 30 minutes - profile rarely changes
        gcTime: 3600000,    // 1 hour in memory
      }),
    ]).catch(error => {
      console.error('[AppDataProvider] Prefetch error:', error);
    });
  }, [user?.id, roleLoading, queryClient]);

  return (
    <AppDataContext.Provider value={{ isReady: !roleLoading && !!user }}>
      {children}
    </AppDataContext.Provider>
  );
}

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  adminUserId?: string;
  targetUserId?: string;
  action?: string;
}

export const useAuditLogs = (filters?: AuditLogFilters) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_logs')
        .select(`
          id,
          admin_user_id,
          target_user_id,
          action,
          details,
          ip_address,
          created_at,
          admin:profiles!admin_user_id(full_name, email),
          target:profiles!target_user_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }

      if (filters?.targetUserId) {
        query = query.eq('target_user_id', filters.targetUserId);
      }

      if (filters?.action && filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};

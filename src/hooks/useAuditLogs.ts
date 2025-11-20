import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  adminUserId?: string;
  targetUserId?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export const useAuditLogs = (filters?: AuditLogFilters) => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

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
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

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

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        logs: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
  });
};

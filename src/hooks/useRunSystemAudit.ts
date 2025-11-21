import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/auditLog";

export interface AuditIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  metadata?: Record<string, any>;
}

export interface AuditCategory {
  status: 'healthy' | 'warning' | 'critical';
  score?: number;
  issues: AuditIssue[];
}

export interface AuditReport {
  timestamp: string;
  overall_status: 'healthy' | 'warning' | 'critical';
  summary: {
    total_issues: number;
    critical: number;
    warning: number;
    info: number;
  };
  categories: {
    security: AuditCategory;
    system_health: AuditCategory;
    data_integrity: AuditCategory;
    users: AuditCategory;
    financial: AuditCategory;
    integrations: AuditCategory;
  };
  recommendations: string[];
  execution_time_ms: number;
}

export const useRunSystemAudit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AuditReport> => {
      console.log('🔍 Starting system audit...');
      
      const { data, error } = await supabase.functions.invoke('run-system-audit');
      
      if (error) {
        console.error('❌ Audit error:', error);
        throw error;
      }
      
      return data as AuditReport;
    },
    onSuccess: (data) => {
      console.log('✅ Audit completed:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      queryClient.invalidateQueries({ queryKey: ['audit-reports'] });
      
      // Registrar no audit log
      logAuditAction({
        action: 'system_audit_executed',
        details: {
          overall_status: data.overall_status,
          total_issues: data.summary.total_issues,
          critical_count: data.summary.critical,
          warning_count: data.summary.warning,
          execution_time_ms: data.execution_time_ms
        }
      });
      
      // Toast com resultado
      const statusEmoji = data.overall_status === 'healthy' ? '✅' : 
                         data.overall_status === 'warning' ? '⚠️' : '🔴';
      
      toast.success(
        `${statusEmoji} Auditoria concluída: ${data.summary.total_issues} issues detectados`,
        {
          description: `${data.summary.critical} críticos, ${data.summary.warning} avisos (${data.execution_time_ms}ms)`
        }
      );
    },
    onError: (error: any) => {
      console.error('❌ Audit failed:', error);
      toast.error('Erro ao executar auditoria', {
        description: error.message || 'Tente novamente'
      });
    }
  });
};

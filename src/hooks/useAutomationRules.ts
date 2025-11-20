import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutomationRule {
  id: string;
  rule_type: 'auto_approval' | 'trial_expiration' | 'plan_renewal' | 'plan_upgrade' | 'custom_notification';
  rule_name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  config: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecutionLog {
  id: string;
  rule_id: string;
  target_user_id: string | null;
  execution_status: 'success' | 'failed' | 'skipped';
  execution_details: Record<string, any>;
  error_message: string | null;
  executed_at: string;
  admin_automation_rules?: {
    rule_name: string;
    rule_type: string;
  };
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

export const useAutomationRules = () => {
  return useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_automation_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as AutomationRule[];
    },
  });
};

export const useCreateAutomationRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<AutomationRule, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("admin_automation_rules")
        .insert({
          ...rule,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Regra de automação criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar regra:", error);
      toast.error("Erro ao criar regra de automação");
    },
  });
};

export const useUpdateAutomationRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutomationRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("admin_automation_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Regra atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar regra:", error);
      toast.error("Erro ao atualizar regra");
    },
  });
};

export const useDeleteAutomationRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_automation_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Regra excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir regra:", error);
      toast.error("Erro ao excluir regra");
    },
  });
};

export const useToggleAutomationRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("admin_automation_rules")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success(variables.is_active ? "Regra ativada!" : "Regra desativada!");
    },
    onError: (error) => {
      console.error("Erro ao alternar regra:", error);
      toast.error("Erro ao alternar status da regra");
    },
  });
};

export const useAutomationExecutionLogs = (ruleId?: string) => {
  return useQuery({
    queryKey: ["automation-execution-logs", ruleId],
    queryFn: async () => {
      let query = supabase
        .from("automation_execution_logs")
        .select(`
          *,
          admin_automation_rules(rule_name, rule_type)
        `)
        .order("executed_at", { ascending: false })
        .limit(100);

      if (ruleId) {
        query = query.eq("rule_id", ruleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Buscar dados de usuários separadamente para evitar erro de relacionamento
      const logsWithUsers = await Promise.all(
        (data || []).map(async (log) => {
          if (log.target_user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", log.target_user_id)
              .single();
            
            return {
              ...log,
              profiles: profile || undefined
            };
          }
          return log;
        })
      );
      
      return logsWithUsers as AutomationExecutionLog[];
    },
  });
};

export const useAutomationStats = () => {
  return useQuery({
    queryKey: ["automation-stats"],
    queryFn: async () => {
      // Total de regras ativas
      const { data: activeRules } = await supabase
        .from("admin_automation_rules")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      // Execuções nas últimas 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentExecutions } = await supabase
        .from("automation_execution_logs")
        .select("id, execution_status", { count: "exact" })
        .gte("executed_at", yesterday.toISOString());

      const totalExecutions = recentExecutions?.length || 0;
      const successfulExecutions = recentExecutions?.filter(e => e.execution_status === 'success').length || 0;
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      // Estimativa de tempo economizado (baseado em 5 minutos por ação manual)
      const timeSavedMinutes = successfulExecutions * 5;

      return {
        active_rules: activeRules?.length || 0,
        executions_24h: totalExecutions,
        success_rate: Math.round(successRate),
        time_saved_hours: Math.round(timeSavedMinutes / 60)
      };
    },
  });
};

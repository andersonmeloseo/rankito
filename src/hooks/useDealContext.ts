import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DealContext {
  lastNote?: {
    content: string;
    created_at: string;
  };
  nextTask?: {
    id: string;
    title: string;
    due_date: string;
    type: string;
    priority: string;
  };
  lastActivity?: {
    title: string;
    created_at: string;
    activity_type: string;
  };
  counts: {
    notes: number;
    tasks: number;
    activities: number;
  };
}

export const useDealContext = (dealId: string, userId: string) => {
  return useQuery({
    queryKey: ['deal-context', dealId],
    queryFn: async () => {
      // Buscar última nota
      const { data: lastNote } = await supabase
        .from('crm_notes')
        .select('content, created_at')
        .eq('deal_id', dealId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Buscar próxima tarefa pendente
      const { data: nextTask } = await supabase
        .from('crm_tasks')
        .select('id, title, due_date, type, priority')
        .eq('deal_id', dealId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(1)
        .single();

      // Buscar última atividade
      const { data: lastActivity } = await supabase
        .from('crm_activities')
        .select('title, created_at, activity_type')
        .eq('deal_id', dealId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Contar totais
      const [notesCount, tasksCount, activitiesCount] = await Promise.all([
        supabase
          .from('crm_notes')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', dealId)
          .eq('user_id', userId),
        supabase
          .from('crm_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', dealId)
          .eq('user_id', userId)
          .eq('status', 'pending'),
        supabase
          .from('crm_activities')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', dealId)
          .eq('user_id', userId),
      ]);

      const context: DealContext = {
        lastNote: lastNote || undefined,
        nextTask: nextTask || undefined,
        lastActivity: lastActivity || undefined,
        counts: {
          notes: notesCount.count || 0,
          tasks: tasksCount.count || 0,
          activities: activitiesCount.count || 0,
        },
      };

      return context;
    },
    enabled: !!dealId && !!userId,
  });
};

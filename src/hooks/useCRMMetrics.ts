import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CRMMetrics {
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  totalValue: number;
  forecast: number;
  avgDaysToClose: number;
  dealsClosingSoon: number;
  overdueTasks: number;
}

export const useCRMMetrics = (userId: string) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['crm-metrics', userId],
    queryFn: async () => {
      // Fetch deals
      const { data: deals, error: dealsError } = await supabase
        .from('crm_deals')
        .select('*')
        .eq('user_id', userId);

      if (dealsError) throw dealsError;

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString());

      if (tasksError) throw tasksError;

      // Calculate metrics
      const totalDeals = deals?.length || 0;
      const activeDeals = deals?.filter(d => ['lead', 'contact', 'proposal', 'negotiation'].includes(d.stage)).length || 0;
      const wonDeals = deals?.filter(d => d.stage === 'won').length || 0;
      const lostDeals = deals?.filter(d => d.stage === 'lost').length || 0;
      const closedDeals = wonDeals + lostDeals;
      const winRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0;

      const totalValue = deals?.filter(d => d.stage === 'won').reduce((sum, d) => sum + Number(d.value), 0) || 0;
      
      const forecast = deals
        ?.filter(d => !['won', 'lost'].includes(d.stage))
        .reduce((sum, d) => sum + (Number(d.value) * (d.probability / 100)), 0) || 0;

      const wonDealsData = deals?.filter(d => d.stage === 'won' && d.closed_at) || [];
      const avgDaysToClose = wonDealsData.length > 0
        ? wonDealsData.reduce((sum, d) => {
            const days = Math.floor((new Date(d.closed_at!).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / wonDealsData.length
        : 0;

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const dealsClosingSoon = deals
        ?.filter(d => 
          !['won', 'lost'].includes(d.stage) && 
          d.expected_close_date && 
          new Date(d.expected_close_date) <= thirtyDaysFromNow
        ).length || 0;

      const overdueTasks = tasks?.length || 0;

      return {
        totalDeals,
        activeDeals,
        wonDeals,
        lostDeals,
        winRate: Math.round(winRate * 10) / 10,
        totalValue,
        forecast,
        avgDaysToClose: Math.round(avgDaysToClose * 10) / 10,
        dealsClosingSoon,
        overdueTasks,
      } as CRMMetrics;
    },
  });

  return {
    metrics,
    isLoading,
  };
};

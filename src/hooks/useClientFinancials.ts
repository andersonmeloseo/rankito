import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';

export interface ClientPayment {
  id: string;
  site_id: string;
  client_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  reference_month: string;
  payment_method: string | null;
  notes: string | null;
  site_name?: string;
}

export interface ClientFinancialSummary {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  nextDueDate: string | null;
  nextDueAmount: number;
  overdueCount: number;
  pendingCount: number;
  paidCount: number;
}

export interface ClientFinancialData {
  payments: ClientPayment[];
  summary: ClientFinancialSummary;
  upcomingPayments: ClientPayment[];
  recentPayments: ClientPayment[];
}

export const useClientFinancials = (clientId: string | null, periodDays: number = 90) => {
  return useQuery({
    queryKey: ['client-financials', clientId, periodDays],
    queryFn: async (): Promise<ClientFinancialData> => {
      if (!clientId) {
        return {
          payments: [],
          summary: {
            totalPending: 0,
            totalOverdue: 0,
            totalPaid: 0,
            nextDueDate: null,
            nextDueAmount: 0,
            overdueCount: 0,
            pendingCount: 0,
            paidCount: 0,
          },
          upcomingPayments: [],
          recentPayments: [],
        };
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Fetch payments with site information
      const { data: payments, error } = await supabase
        .from('rank_rent_payments')
        .select(`
          id,
          site_id,
          client_id,
          amount,
          due_date,
          payment_date,
          status,
          reference_month,
          payment_method,
          notes,
          rank_rent_sites (
            site_name
          )
        `)
        .eq('client_id', clientId)
        .gte('due_date', format(startDate, 'yyyy-MM-dd'))
        .order('due_date', { ascending: false });

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Process payments and enrich data
      const processedPayments: ClientPayment[] = (payments || []).map(p => {
        const dueDate = parseISO(p.due_date);
        let status: 'pending' | 'paid' | 'overdue' = p.status as 'pending' | 'paid' | 'overdue';

        // Auto-update status based on due date
        if (status === 'pending' && isBefore(dueDate, today)) {
          status = 'overdue';
        }

        return {
          id: p.id,
          site_id: p.site_id,
          client_id: p.client_id,
          amount: p.amount,
          due_date: p.due_date,
          payment_date: p.payment_date,
          status,
          reference_month: p.reference_month,
          payment_method: p.payment_method,
          notes: p.notes,
          site_name: (p.rank_rent_sites as any)?.site_name || 'Site sem nome',
        };
      });

      // Calculate summary
      const pendingPayments = processedPayments.filter(p => p.status === 'pending');
      const overduePayments = processedPayments.filter(p => p.status === 'overdue');
      const paidPayments = processedPayments.filter(p => p.status === 'paid');

      const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);

      // Find next payment due
      const upcomingPayments = pendingPayments
        .filter(p => isAfter(parseISO(p.due_date), today) || parseISO(p.due_date).getTime() === today.getTime())
        .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime())
        .slice(0, 3);

      const nextPayment = upcomingPayments[0];

      const summary: ClientFinancialSummary = {
        totalPending,
        totalOverdue,
        totalPaid,
        nextDueDate: nextPayment?.due_date || null,
        nextDueAmount: nextPayment?.amount || 0,
        overdueCount: overduePayments.length,
        pendingCount: pendingPayments.length,
        paidCount: paidPayments.length,
      };

      // Recent payments (last 10)
      const recentPayments = processedPayments.slice(0, 10);

      return {
        payments: processedPayments,
        summary,
        upcomingPayments,
        recentPayments,
      };
    },
    enabled: !!clientId,
    refetchInterval: 60000, // Refetch every minute
  });
};

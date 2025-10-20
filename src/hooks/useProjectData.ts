import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useProjectData = (clientId: string) => {
  return useQuery({
    queryKey: ['project-data', clientId],
    queryFn: async () => {
      // Buscar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('rank_rent_clients')
        .select('*, rank_rent_sites(*)')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      // Buscar total de páginas ativas dos sites deste cliente
      const siteIds = clientData.rank_rent_sites?.map((s: any) => s.id) || [];
      
      const { count: activePagesCount } = await supabase
        .from('rank_rent_pages')
        .select('*', { count: 'exact', head: true })
        .in('site_id', siteIds)
        .eq('status', 'active');

      // Buscar histórico de pagamentos
      const { data: payments } = await supabase
        .from('rank_rent_payments')
        .select('*')
        .eq('client_id', clientId)
        .order('due_date', { ascending: false })
        .limit(12);

      // Calcular dias restantes do contrato
      const contractEndDate = clientData.contract_end_date ? new Date(clientData.contract_end_date) : null;
      const today = new Date();
      const daysRemaining = contractEndDate 
        ? Math.max(0, Math.ceil((contractEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      // URL principal do projeto (primeiro site)
      const projectUrl = clientData.rank_rent_sites?.[0]?.site_url || null;

      // Calcular valor mensal total
      const monthlyValue = clientData.rank_rent_sites?.reduce(
        (sum: number, site: any) => sum + (Number(site.monthly_rent_value) || 0),
        0
      ) || 0;

      // Buscar próximo pagamento pendente ou em atraso
      const nextPayment = payments?.find(p => p.status === 'pending' || p.status === 'overdue');
      const nextPaymentDate = nextPayment?.due_date || null;
      const nextPaymentAmount = nextPayment ? Number(nextPayment.amount) : 0;

      // Calcular status do pagamento
      let paymentStatus: 'current' | 'overdue' | 'due_soon' = 'current';
      if (nextPaymentDate) {
        const dueDate = new Date(nextPaymentDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
          paymentStatus = 'overdue'; // Atrasado
        } else if (daysUntilDue <= 7) {
          paymentStatus = 'due_soon'; // Vence em breve (próximos 7 dias)
        }
      }

      return {
        clientName: clientData.name,
        clientCompany: clientData.company,
        projectUrl,
        totalSites: clientData.rank_rent_sites?.length || 0,
        activePagesCount: activePagesCount || 0,
        contractStartDate: clientData.contract_start_date,
        contractEndDate: clientData.contract_end_date,
        daysRemaining,
        monthlyValue,
        autoRenew: clientData.rank_rent_sites?.[0]?.auto_renew || false,
        paymentHistory: payments || [],
        contractStatus: daysRemaining === null ? 'active' : daysRemaining > 30 ? 'active' : daysRemaining > 0 ? 'expiring_soon' : 'expired',
        nextPaymentDate,
        nextPaymentAmount,
        paymentStatus,
      };
    },
    enabled: !!clientId,
    staleTime: 30000,
  });
};

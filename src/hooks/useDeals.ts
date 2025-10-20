import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./use-toast";

export interface Deal {
  id: string;
  user_id: string;
  client_id: string | null;
  site_id: string | null;
  title: string;
  description: string | null;
  value: number;
  stage: 'lead' | 'contact' | 'proposal' | 'negotiation' | 'won' | 'lost';
  probability: number;
  expected_close_date: string | null;
  lost_reason: string | null;
  card_color: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  source: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  target_niche: string | null;
  target_location: string | null;
  rank_rent_clients?: {
    name: string;
    email: string;
    phone: string;
  };
  rank_rent_sites?: {
    site_name: string;
    niche: string;
    location: string;
    site_url: string;
  };
}

interface DealFilters {
  stage?: string;
  search?: string;
}

export const useDeals = (userId: string, filters?: DealFilters) => {
  const queryClient = useQueryClient();

  const { data: deals, isLoading } = useQuery({
    queryKey: ['deals', userId, filters],
    queryFn: async () => {
      let query = supabase
        .from('crm_deals')
        .select(`
          *,
          rank_rent_clients (
            name,
            email,
            phone
          ),
          rank_rent_sites (
            site_name,
            niche,
            location,
            site_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Deal[];
    },
  });

  const createDeal = useMutation({
    mutationFn: async (newDeal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'closed_at' | 'rank_rent_clients'>) => {
      const { error } = await supabase
        .from('crm_deals')
        .insert([newDeal]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast({
        title: "Deal criado",
        description: "O deal foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar deal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Deal> }) => {
      const { error } = await supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast({
        title: "Deal atualizado",
        description: "O deal foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar deal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast({
        title: "Deal removido",
        description: "O deal foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover deal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    deals,
    isLoading,
    createDeal: createDeal.mutate,
    updateDeal: updateDeal.mutate,
    deleteDeal: deleteDeal.mutate,
  };
};

export const useDealsByStage = (userId: string, stage: string) => {
  return useDeals(userId, { stage });
};

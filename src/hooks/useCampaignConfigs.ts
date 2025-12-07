import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CampaignConfig {
  id: string;
  site_id: string;
  user_id: string;
  goal_id: string | null;
  campaign_name: string;
  utm_campaign_pattern: string | null;
  utm_source_pattern: string | null;
  utm_medium_pattern: string | null;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  goal?: {
    id: string;
    goal_name: string;
    conversion_value: number;
  } | null;
}

export interface CreateCampaignInput {
  site_id: string;
  goal_id?: string | null;
  campaign_name: string;
  utm_campaign_pattern?: string | null;
  utm_source_pattern?: string | null;
  utm_medium_pattern?: string | null;
  budget?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

export interface CampaignEvent {
  id: string;
  event_type: string;
  cta_text: string | null;
  page_url: string;
  page_path: string;
  created_at: string;
  city: string | null;
  region: string | null;
  country: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  gclid: string | null;
  fbclid: string | null;
  session_id: string | null;
  conversion_value: number;
  goal_name: string | null;
}

export const useCampaignConfigs = (siteId: string) => {
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaign-configs', siteId],
    queryFn: async (): Promise<CampaignConfig[]> => {
      const { data, error } = await supabase
        .from('marketing_campaign_configs')
        .select(`
          *,
          goal:conversion_goals(id, goal_name, conversion_value)
        `)
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CampaignConfig[];
    },
    enabled: !!siteId,
  });

  const createCampaign = useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('marketing_campaign_configs')
        .insert({
          ...input,
          user_id: user.id,
          budget: input.budget || 0,
          is_active: input.is_active !== undefined ? input.is_active : true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-configs', siteId] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CampaignConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketing_campaign_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-configs', siteId] });
      toast.success('Campanha atualizada!');
    },
    onError: (error) => {
      console.error('Error updating campaign:', error);
      toast.error('Erro ao atualizar campanha');
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('marketing_campaign_configs')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-configs', siteId] });
      toast.success('Campanha removida!');
    },
    onError: (error) => {
      console.error('Error deleting campaign:', error);
      toast.error('Erro ao remover campanha');
    },
  });

  return {
    campaigns: campaigns || [],
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
};

// Hook to fetch events for a specific campaign
export const useCampaignEvents = (siteId: string, campaign: CampaignConfig | null, days: number = 30) => {
  return useQuery({
    queryKey: ['campaign-events', siteId, campaign?.id, campaign?.goal_id, days],
    queryFn: async (): Promise<CampaignEvent[]> => {
      if (!campaign) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('rank_rent_conversions')
        .select('id, event_type, cta_text, page_url, page_path, created_at, city, region, country, utm_campaign, utm_source, utm_medium, gclid, fbclid, session_id, conversion_value, goal_name, goal_id')
        .eq('site_id', siteId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Se a campanha tem uma meta vinculada, adicionar filtro de goal
      if (campaign.goal_id) {
        query = query.eq('goal_id', campaign.goal_id);
      }

      // SEMPRE aplicar filtros UTM se existirem (combinado com goal_id)
      if (campaign.utm_campaign_pattern) {
        query = query.ilike('utm_campaign', `%${campaign.utm_campaign_pattern}%`);
      }
      if (campaign.utm_source_pattern) {
        query = query.ilike('utm_source', `%${campaign.utm_source_pattern}%`);
      }
      if (campaign.utm_medium_pattern) {
        query = query.ilike('utm_medium', `%${campaign.utm_medium_pattern}%`);
      }

      const { data, error } = await query.range(0, 999);

      if (error) throw error;
      return (data || []) as CampaignEvent[];
    },
    enabled: !!siteId && !!campaign,
  });
};

// Hook to detect unconfigured campaigns from UTM data
// Conta apenas conversões REAIS (exclui page_view e page_exit)
export const useDetectedCampaigns = (siteId: string, configuredPatterns: string[], days: number = 30) => {
  return useQuery({
    queryKey: ['detected-campaigns', siteId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('rank_rent_conversions')
        .select('utm_campaign, utm_source, utm_medium, gclid, fbclid, event_type')
        .eq('site_id', siteId)
        .gte('created_at', startDate.toISOString())
        .not('utm_campaign', 'is', null)
        .range(0, 4999);

      if (error) throw error;

      // Aggregate by utm_campaign - conta apenas conversões reais
      const campaignMap = new Map<string, { 
        conversions: number; 
        totalEvents: number;
        sources: Set<string>; 
        mediums: Set<string>; 
        hasGoogle: boolean; 
        hasMeta: boolean 
      }>();
      
      (data || []).forEach((event) => {
        const campaign = event.utm_campaign;
        if (!campaign) return;

        // Skip if this campaign pattern is already configured
        const isConfigured = configuredPatterns.some(pattern => 
          campaign.toLowerCase().includes(pattern.toLowerCase())
        );
        if (isConfigured) return;

        if (!campaignMap.has(campaign)) {
          campaignMap.set(campaign, { 
            conversions: 0,
            totalEvents: 0, 
            sources: new Set(), 
            mediums: new Set(),
            hasGoogle: false,
            hasMeta: false
          });
        }
        
        const entry = campaignMap.get(campaign)!;
        entry.totalEvents++;
        
        // Só conta como conversão se NÃO for page_view ou page_exit
        if (!['page_view', 'page_exit'].includes(event.event_type || '')) {
          entry.conversions++;
        }
        
        if (event.utm_source) entry.sources.add(event.utm_source);
        if (event.utm_medium) entry.mediums.add(event.utm_medium);
        if (event.gclid) entry.hasGoogle = true;
        if (event.fbclid) entry.hasMeta = true;
      });

      return Array.from(campaignMap.entries())
        .map(([name, data]) => ({
          utm_campaign: name,
          conversions: data.conversions,
          total_events: data.totalEvents,
          sources: Array.from(data.sources),
          mediums: Array.from(data.mediums),
          hasGoogle: data.hasGoogle,
          hasMeta: data.hasMeta,
        }))
        .sort((a, b) => b.conversions - a.conversions);
    },
    enabled: !!siteId,
  });
};
